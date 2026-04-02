const { extractId } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'reaction-role',
    aliases: ['reactionrole'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 3, max: 3, usage: 'reaction-role [message_id] [emoji] @role' },
    descriptionKey: 'roles.descriptions.reactionRole',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const messageId = extractId(args[0]);
    const emoji = args[1];
    const roleId = extractId(args[2]);

    if (!messageId || !emoji || !roleId) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const role = message.guild.roles.cache.get(roleId);
    if (!role) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    const targetMessage = await message.channel.messages.fetch(messageId);
    await targetMessage.react(emoji);

    await repos.reactionRoleRepo.addReactionRole({
      guildId: message.guild.id,
      channelId: message.channel.id,
      messageId,
      roleId,
      emoji
    });

    await respond({
      description: t('roles.responses.reactionRoleAdded')
    });
  }
};

