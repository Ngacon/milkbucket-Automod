const { extractId, resolveRole } = require('../../app/command-utils');

module.exports = {
  meta: {
    name: 'reaction-role',
    aliases: ['reactionrole'],
    category: 'roles',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldown: 2,
    args: { min: 3, max: 3, usage: 'reaction-role [message_id] [emoji] @role' },
    examples: ['reaction role 123456789012345678 👍 @role'],
    descriptionKey: 'roles.descriptions.reactionRole',
    guildOnly: true
  },
  async execute({ message, args, repos, t, respond }) {
    const messageId = extractId(args[0]);
    const emoji = args[1];
    const role = resolveRole(message, args[2]);

    if (!messageId || !emoji || !role) {
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
      roleId: role.id,
      emoji
    });

    await respond({
      description: t('roles.responses.reactionRoleAdded')
    });
  }
};

