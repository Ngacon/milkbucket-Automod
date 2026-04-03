const { PermissionsBitField } = require('discord.js');
const { resolveChannel } = require('../../app/command-utils');
const { BOT_EMOJIS } = require('../../config/constants');
const { sendModerationLog } = require('../../services/moderation/modlog');

module.exports = {
  meta: {
    name: 'setlog',
    aliases: ['modlog'],
    category: 'moderation',
    permissions: ['ManageGuild'],
    botPermissions: ['SendMessages', 'EmbedLinks', 'ViewChannel'],
    cooldown: 2,
    args: { min: 1, max: 5, usage: 'setlog #channel' },
    examples: ['setlog #mod-log'],
    descriptionKey: 'moderation.descriptions.setlog',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond, colors, prefix }) {
    const channel = resolveChannel(message, args.join(' '));
    if (!channel?.isTextBased()) {
      await respond({
        color: colors.WARNING,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.invalidCommandUsage', {
          usage: `${prefix}setlog #channel`
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    const botPermissions = channel.permissionsFor(message.guild.members.me);
    const required = [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks
    ];
    const hasPermissions = required.every((permission) => botPermissions?.has(permission));

    if (!hasPermissions) {
      await respond({
        color: colors.ERROR,
        description: `${BOT_EMOJIS.BROWTH.mention} ${t('common.errors.missingBotPermissions', {
          permissions: 'ViewChannel, SendMessages, EmbedLinks'
        })}`,
        thumbnail: BOT_EMOJIS.BROWTH.imageUrl
      });
      return;
    }

    await repos.automodRepo.setModlogChannel(message.guild.id, channel.id);
    await sendModerationLog({
      guild: message.guild,
      repos,
      channelId: channel.id,
      title: t('moderation.responses.logTitle', {
        action: 'Setup'
      }),
      description: t('moderation.responses.modlogSet', {
        channel: channel.toString()
      }),
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      fields: [
        {
          name: t('moderation.labels.moderator'),
          value: `${message.author.tag} (${message.author.id})`,
          inline: false
        }
      ]
    });
    await respond({
      color: colors.SUCCESS,
      thumbnail: BOT_EMOJIS.AUTOMOD.imageUrl,
      description: t('moderation.responses.modlogSet', {
        channel: channel.toString()
      })
    });
  }
};
