const { buildEmbed } = require('./embeds');
const {
  DEFAULT_LOCALE,
  EMBED_COLORS,
  BOT_EMOJIS
} = require('../config/constants');

const INVITE_REGEX = /(discord\.gg|discord\.com\/invite)\//i;
const LINK_REGEX = /(https?:\/\/|www\.)/i;

function countCapsRatio(content) {
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 5) {
    return 0;
  }
  const caps = letters.replace(/[^A-Z]/g, '').length;
  return caps / letters.length;
}

function containsBlacklistedWord(content, words) {
  const lowered = content.toLowerCase();
  return words.some((word) => lowered.includes(word.toLowerCase()));
}

function createAutomodService({ automodRepo, guildSettingsRepo, i18n, redis, logger }) {
  async function checkMessage({ message }) {
    if (!message.guild || message.author?.bot) {
      return null;
    }

    const settings = await automodRepo.getSettings(message.guild.id);
    if (!settings.enabled) {
      return null;
    }

    const content = message.content || '';

    if (settings.antilink && LINK_REGEX.test(content)) {
      return { key: 'automod.violations.antilink' };
    }

    if (settings.antiinvite && INVITE_REGEX.test(content)) {
      return { key: 'automod.violations.antiinvite' };
    }

    if (settings.anticaps && countCapsRatio(content) > 0.7) {
      return { key: 'automod.violations.anticaps' };
    }

    if (settings.antimention && message.mentions.users.size > settings.antimention) {
      return { key: 'automod.violations.antimention', params: { max: settings.antimention } };
    }

    if (settings.antidup && redis) {
      const key = `antidup:${message.guild.id}:${message.author.id}`;
      const lastMessage = await redis.get(key);
      if (lastMessage && lastMessage === content) {
        return { key: 'automod.violations.antidup' };
      }
      await redis.set(key, content, 'EX', 30);
    }

    if (settings.antispam && redis) {
      const key = `antispam:${message.guild.id}:${message.author.id}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 10);
      }
      if (count > 6) {
        return { key: 'automod.violations.antispam' };
      }
    }

    const words = await automodRepo.listWords(message.guild.id);
    if (words.length > 0 && containsBlacklistedWord(content, words)) {
      return { key: 'automod.violations.badword' };
    }

    return null;
  }

  async function notifyViolation(message, violation) {
    if (!message.guild || !message.channel?.isTextBased()) {
      return;
    }

    try {
      const settings = guildSettingsRepo
        ? await guildSettingsRepo.getSettings(message.guild.id)
        : { locale: DEFAULT_LOCALE };
      const locale = settings.locale || DEFAULT_LOCALE;
      const t = i18n ? (key, params) => i18n.t(locale, key, params) : (key) => key;
      const warningMessage = await message.channel.send({
        embeds: [
          buildEmbed({
            color: EMBED_COLORS.WARNING,
            description: `${BOT_EMOJIS.AUTOMOD.mention} ${t(violation.key, violation.params)}`,
            thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl
          })
        ]
      });

      setTimeout(() => {
        warningMessage.delete().catch(() => null);
      }, 5000);
    } catch (error) {
      logger.warn('Automod could not send notification', {
        error,
        guildId: message.guild.id,
        channelId: message.channelId
      });
    }
  }

  async function handleMessage(message) {
    const violation = await checkMessage({ message });
    if (!violation) {
      return null;
    }

    try {
      await message.delete();
    } catch (error) {
      logger.warn('Automod could not delete message', {
        error,
        messageId: message.id
      });
    }

    await notifyViolation(message, violation);
    return violation;
  }

  return {
    handleMessage,
    checkMessage
  };
}

module.exports = {
  createAutomodService
};
