const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseMessageReference,
  normalizeReactionEmoji,
  getReactionEmojiLookupKeys,
  resolveTargetMessage
} = require('../src/app/reaction-role-utils');

test('parseMessageReference parses Discord message links', () => {
  const result = parseMessageReference(
    'https://discord.com/channels/111111111111111111/222222222222222222/333333333333333333',
    '444444444444444444'
  );

  assert.deepEqual(result, {
    source: 'link',
    guildId: '111111111111111111',
    channelId: '222222222222222222',
    messageId: '333333333333333333'
  });
});

test('resolveTargetMessage falls back to the current channel for raw message ids', async () => {
  const targetMessage = {
    id: '333333333333333333'
  };
  const channel = {
    id: '222222222222222222',
    messages: {
      fetch: async (messageId) => {
        assert.equal(messageId, '333333333333333333');
        return targetMessage;
      }
    },
    permissionsFor: () => ({
      has: () => true
    })
  };
  const message = {
    channelId: '222222222222222222',
    channel,
    guild: {
      id: '111111111111111111',
      channels: {
        fetch: async () => {
          throw new Error('guild channel fetch should not be called for raw ids');
        }
      },
      members: {
        me: {
          id: '999999999999999999'
        }
      }
    }
  };

  const result = await resolveTargetMessage(message, '333333333333333333', {
    requiredPermissions: ['ViewChannel']
  });

  assert.equal(result.ok, true);
  assert.equal(result.messageId, '333333333333333333');
  assert.equal(result.channelId, '222222222222222222');
  assert.equal(result.targetMessage, targetMessage);
});

test('normalizeReactionEmoji understands unicode, custom markup, and canonical keys', () => {
  assert.deepEqual(normalizeReactionEmoji('👍'), {
    key: 'unicode:👍',
    type: 'unicode',
    id: null,
    name: '👍',
    animated: false,
    display: '👍'
  });

  assert.deepEqual(normalizeReactionEmoji('<:milk:123456789012345678>'), {
    key: 'custom:123456789012345678',
    type: 'custom',
    id: '123456789012345678',
    name: 'milk',
    animated: false,
    display: '<:milk:123456789012345678>'
  });

  assert.deepEqual(normalizeReactionEmoji('custom:123456789012345678'), {
    key: 'custom:123456789012345678',
    type: 'custom',
    id: '123456789012345678',
    name: null,
    animated: false,
    display: 'custom:123456789012345678'
  });
});

test('getReactionEmojiLookupKeys includes canonical and legacy match values', () => {
  assert.deepEqual(getReactionEmojiLookupKeys('<:milk:123456789012345678>'), [
    'custom:123456789012345678',
    '<:milk:123456789012345678>',
    '123456789012345678',
    '<a:milk:123456789012345678>'
  ]);
});
