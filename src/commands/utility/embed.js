module.exports = {
  meta: {
    name: 'embed',
    aliases: [],
    category: 'utility',
    permissions: ['ManageMessages'],
    botPermissions: ['ManageMessages'],
    cooldown: 2,
    args: { min: 2, max: 20, usage: 'embed create|edit [messageId] title | description' },
    descriptionKey: 'utility.descriptions.embed',
    guildOnly: true
  },
  async execute({ message, args, buildEmbed, respond, t }) {
    const mode = args.shift();
    let messageId = null;
    if (mode === 'edit') {
      messageId = args.shift();
    }
    const content = args.join(' ');
    const parts = content.split('|').map((part) => part.trim());
    const title = parts[0];
    const description = parts.slice(1).join(' | ');

    if (mode === 'create') {
      await message.channel.send({
        embeds: [buildEmbed({ title, description })]
      });
      await respond({ description: t('common.responses.success') });
      return;
    }

    if (mode === 'edit') {
      const target = await message.channel.messages.fetch(messageId).catch(() => null);
      if (!target) {
        await respond({ description: t('common.responses.failure') });
        return;
      }
      await target.edit({ embeds: [buildEmbed({ title, description })] });
      await respond({ description: t('common.responses.success') });
      return;
    }

    await respond({ description: t('common.responses.failure') });
  }
};

