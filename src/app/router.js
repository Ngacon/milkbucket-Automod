const fs = require('node:fs');
const path = require('node:path');
const { buildEmbed } = require('./embeds');
const {
  buildRegistry,
  resolveCommand,
  normalizeCommandKey
} = require('./command-registry');
const { checkCommandAccess } = require('./guards');
const {
  isIgnorableMessage,
  parseCommandInput,
  validateCommandArgs
} = require('./validators');
const {
  DEFAULT_LOCALE,
  DEFAULT_PREFIXES,
  EMBED_COLORS,
  BOT_EMOJIS
} = require('../config/constants');
const { LOG_COMMANDS } = require('../config/feature-flags');

function walkJavaScriptFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...walkJavaScriptFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

function loadCommandsFromDirectory(commandsDirectory, logger) {
  const commandFiles = walkJavaScriptFiles(commandsDirectory);
  const commands = [];

  for (const commandFile of commandFiles) {
    delete require.cache[require.resolve(commandFile)];
    const command = require(commandFile);

    if (!command?.meta?.name || typeof command.execute !== 'function') {
      logger.warn('Skipped invalid command module', {
        commandFile
      });
      continue;
    }

    commands.push(command);
  }

  logger.info('Commands loaded', {
    count: commands.length
  });

  return commands;
}

function resolvePrefix(messageContent, customPrefix) {
  const normalizedContent = messageContent.toLowerCase();

  if (customPrefix) {
    return normalizedContent.startsWith(customPrefix.toLowerCase())
      ? customPrefix
      : null;
  }

  return (
    DEFAULT_PREFIXES.find((defaultPrefix) =>
      normalizedContent.startsWith(defaultPrefix)
    ) || null
  );
}

async function safeReply(message, payload, logger) {
  try {
    return await message.reply({
      allowedMentions: {
        repliedUser: false
      },
      ...payload
    });
  } catch (error) {
    logger.error('Failed to reply to message', {
      error,
      channelId: message.channelId,
      messageId: message.id
    });

    const fallbackContent =
      payload.embeds?.[0]?.data?.description ||
      payload.embeds?.[0]?.data?.title ||
      payload.content ||
      'Unable to send embed response.';

    try {
      return await message.reply({
        allowedMentions: {
          repliedUser: false
        },
        content: fallbackContent
      });
    } catch (fallbackError) {
      logger.error('Failed to send fallback text reply', {
        error: fallbackError,
        channelId: message.channelId,
        messageId: message.id
      });
    }

    return null;
  }
}

function decorateErrorOptions(key, description) {
  if (!description) {
    return {};
  }

  if (key === 'common.errors.invalidCommandUsage' || key === 'common.errors.missingBotPermissions') {
    return {
      description: `${BOT_EMOJIS.BROWTH.mention} ${description}`,
      thumbnail: BOT_EMOJIS.BROWTH.imageUrl
    };
  }

  if (key === 'common.errors.missingUserPermissions' || key === 'common.errors.ownerWhitelistOnly') {
    return {
      description: `${BOT_EMOJIS.USER_PERMISSIONS.mention} ${description}`,
      thumbnail: BOT_EMOJIS.USER_PERMISSIONS.imageUrl
    };
  }

  if (key === 'common.errors.targetAboveBot') {
    return {
      description: `${BOT_EMOJIS.HIERARCHY.mention} ${description}`,
      thumbnail: BOT_EMOJIS.HIERARCHY.imageUrl
    };
  }

  return {
    description
  };
}

function createRouter({ client, commands, guildSettingsRepo, i18n, logger, db, redis, repos }) {
  const registry = buildRegistry(commands, logger.child('registry'));
  const cooldowns = new Map();

  async function handleMessage(message) {
    if (isIgnorableMessage(message)) {
      return;
    }

    const settings = message.guild
      ? await guildSettingsRepo.getSettings(message.guild.id)
      : {
          guildId: null,
          prefix: null,
          locale: DEFAULT_LOCALE
        };

    const prefix = resolvePrefix(message.content, settings.prefix);

    if (!prefix) {
      return;
    }

    const parsedInput = parseCommandInput(message.content, prefix);

    if (!parsedInput) {
      return;
    }

    const matchedCommand = resolveCommand(registry, parsedInput.tokens);
    const command = matchedCommand?.command || null;
    const commandArgs = matchedCommand?.args || [];
    const locale = settings.locale || DEFAULT_LOCALE;
    const t = (key, params) => i18n.t(locale, key, params);

    if (!command) {
      const attemptedCommand =
        normalizeCommandKey(
          parsedInput.tokens
            .slice(0, Math.min(parsedInput.tokens.length, registry.maxDepth || 1))
            .join(' ')
        ) || parsedInput.commandName;
      const errorKey = 'common.errors.commandNotFound';
      const description = t(errorKey, {
        command: attemptedCommand
      });

      await safeReply(
        message,
        {
          embeds: [
            buildEmbed({
              color: EMBED_COLORS.ERROR,
              ...decorateErrorOptions(errorKey, description)
            })
          ]
        },
        logger
      );
      return;
    }

    const argumentError = validateCommandArgs(command, commandArgs, prefix);

    if (argumentError) {
      const description = t(argumentError.key, argumentError.params);
      await safeReply(
        message,
        {
          embeds: [
            buildEmbed({
              color: EMBED_COLORS.WARNING,
              ...decorateErrorOptions(argumentError.key, description)
            })
          ]
        },
        logger
      );
      return;
    }

    const access = checkCommandAccess(message, command);

    if (!access.ok) {
      const description = t(access.key, access.params);
      await safeReply(
        message,
        {
          embeds: [
            buildEmbed({
              color: EMBED_COLORS.ERROR,
              ...decorateErrorOptions(access.key, description)
            })
          ]
        },
        logger
      );
      return;
    }

    const cooldownSeconds = Number(command.meta.cooldown || 0);
    if (cooldownSeconds > 0) {
      const cooldownKey = `${message.author.id}:${command.meta.name}`;
      const now = Date.now();
      const nextAllowed = cooldowns.get(cooldownKey) || 0;
      if (now < nextAllowed) {
        const remaining = Math.ceil((nextAllowed - now) / 1000);
        await safeReply(
          message,
          {
            embeds: [
              buildEmbed({
                color: EMBED_COLORS.WARNING,
                description: t('common.errors.cooldown', { seconds: remaining })
              })
            ]
          },
          logger
        );
        return;
      }
      cooldowns.set(cooldownKey, now + cooldownSeconds * 1000);
    }

    if (LOG_COMMANDS) {
      logger.info('Command executed', {
        guildId: message.guild?.id || null,
        channelId: message.channelId,
        userId: message.author.id,
        command: command.meta.name
      });
    }

    const commandContext = {
      client,
      message,
      guild: message.guild,
      member: message.member,
      args: commandArgs,
      prefix,
      locale,
      settings,
      guildSettingsRepo,
      i18n,
      logger: logger.child(command.meta.name),
      t,
      buildEmbed,
      colors: EMBED_COLORS,
      db,
      redis,
      repos,
      registry,
      reply: (payload) => safeReply(message, payload, logger),
      respond: (options = {}) => {
        const title = options.titleKey
          ? t(options.titleKey, options.titleParams)
          : options.title;
        const description = options.descriptionKey
          ? t(options.descriptionKey, options.descriptionParams)
          : options.description;
        const isShortText =
          !title &&
          !options.fields?.length &&
          !options.thumbnail &&
          !options.author &&
          typeof description === 'string' &&
          description.length > 0 &&
          description.length <= 60;

        if (options.plain || isShortText) {
          return safeReply(
            message,
            {
              content: description || title || options.content || '-'
            },
            logger
          );
        }

        const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
        const requestedAt = message.createdAt?.toLocaleString(localeCode) || '';
        const footerText =
          options.footerText ||
          t('common.responses.requestedBy', {
            user: message.author.tag,
            time: requestedAt
          });

        return safeReply(
          message,
          {
            embeds: [
              buildEmbed({
                color: options.color || EMBED_COLORS.PRIMARY,
                title,
                description,
                fields: options.fields || [],
                author: options.author,
                thumbnail: options.thumbnail,
                footerText,
                footerIcon: options.footerIcon || message.author.displayAvatarURL({ size: 64 })
              })
            ]
          },
          logger
        );
      }
    };

    try {
      await command.execute(commandContext);
    } catch (error) {
      logger.error('Command execution failed', {
        error,
        command: command.meta.name,
        guildId: message.guild?.id || null,
        userId: message.author.id
      });

      await safeReply(
        message,
        {
          embeds: [
            buildEmbed({
              color: EMBED_COLORS.ERROR,
              description: t('common.errors.generic')
            })
          ]
        },
        logger
      );
    }
  }

  return {
    commands,
    registry,
    handleMessage
  };
}

module.exports = {
  createRouter,
  loadCommandsFromDirectory
};
