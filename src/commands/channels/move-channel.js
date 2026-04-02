const { extractId } = require('../../app/command-utils');

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getSiblingChannels(channel) {
  return [...channel.guild.channels.cache.values()]
    .filter((candidate) => candidate.parentId === channel.parentId)
    .sort((left, right) => left.rawPosition - right.rawPosition);
}

function getDisplayPosition(channels, channelId) {
  const index = channels.findIndex((channel) => channel.id === channelId);
  return index >= 0 ? index + 1 : null;
}

function resolveTargetChannel(message, rawValue) {
  const id = extractId(rawValue);
  if (id) {
    return message.guild.channels.cache.get(id) || null;
  }

  const normalizedName = String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/^#/, '');

  if (!normalizedName) {
    return null;
  }

  return (
    message.guild.channels.cache.find(
      (channel) => channel.name.toLowerCase() === normalizedName
    ) || null
  );
}

function resolveMoveRequest(message, args) {
  const [mode, ...rest] = args;
  const channel = message.channel;
  const siblings = getSiblingChannels(channel);
  const currentIndex = siblings.findIndex((candidate) => candidate.id === channel.id);

  if (currentIndex === -1) {
    return null;
  }

  const normalizedMode = String(mode || '').toLowerCase();

  if (['top', 'first', 'dau', 'tren'].includes(normalizedMode)) {
    return {
      siblings,
      nextIndex: 0,
      summary: 'top'
    };
  }

  if (['bottom', 'last', 'cuoi', 'duoi'].includes(normalizedMode)) {
    return {
      siblings,
      nextIndex: siblings.length - 1,
      summary: 'bottom'
    };
  }

  if (/^[+-]\d+$/.test(normalizedMode)) {
    const offset = Number(normalizedMode);
    return {
      siblings,
      nextIndex: clamp(currentIndex + offset, 0, siblings.length - 1),
      summary: normalizedMode
    };
  }

  if (/^\d+$/.test(normalizedMode)) {
    const targetIndex = clamp(Number(normalizedMode) - 1, 0, siblings.length - 1);
    return {
      siblings,
      nextIndex: targetIndex,
      summary: `#${targetIndex + 1}`
    };
  }

  if (['above', 'below'].includes(normalizedMode)) {
    const targetChannel = resolveTargetChannel(message, rest.join(' '));
    if (!targetChannel) {
      return null;
    }

    const targetIndex = siblings.findIndex((candidate) => candidate.id === targetChannel.id);
    if (targetIndex === -1) {
      return null;
    }

    return {
      siblings,
      nextIndex: clamp(
        targetIndex + (normalizedMode === 'below' ? 1 : 0),
        0,
        siblings.length - 1
      ),
      summary: `${normalizedMode} #${targetChannel.name}`
    };
  }

  return null;
}

module.exports = {
  meta: {
    name: 'move-channel',
    aliases: ['move channel', 'move_channel'],
    category: 'channels',
    permissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    cooldown: 2,
    args: {
      min: 1,
      max: 3,
      usage: 'move-channel <number|top|bottom|+1|-1|above #channel|below #channel>'
    },
    examples: [
      'move-channel 1',
      'move-channel top',
      'move-channel +2',
      'move-channel above #welcome'
    ],
    descriptionKey: 'channels.descriptions.moveChannel',
    guildOnly: true
  },
  async execute({ message, args, t, respond, colors }) {
    const moveRequest = resolveMoveRequest(message, args);

    if (!moveRequest) {
      await respond({
        color: colors.WARNING,
        title: t('channels.responses.moveHelpTitle'),
        description: t('channels.responses.moveHelpDescription'),
        fields: [
          {
            name: t('channels.labels.moveModes'),
            value: t('channels.responses.moveModes'),
            inline: false
          }
        ]
      });
      return;
    }

    const { siblings, nextIndex, summary } = moveRequest;
    const currentPosition = getDisplayPosition(siblings, message.channel.id);
    const targetSibling = siblings[nextIndex];

    if (!targetSibling) {
      await respond({
        description: t('common.responses.failure')
      });
      return;
    }

    await message.channel.setPosition(targetSibling.rawPosition);

    const refreshedSiblings = getSiblingChannels(message.channel);
    const nextPosition = getDisplayPosition(refreshedSiblings, message.channel.id);

    await respond({
      title: t('channels.responses.channelMoved'),
      description: t('channels.responses.channelMovedDetails', {
        channel: message.channel.name,
        from: currentPosition,
        to: nextPosition,
        target: summary
      }),
      fields: [
        {
          name: t('channels.labels.moveCurrent'),
          value: `#${currentPosition}`,
          inline: true
        },
        {
          name: t('channels.labels.moveTarget'),
          value: `#${nextPosition}`,
          inline: true
        }
      ]
    });
  }
};
