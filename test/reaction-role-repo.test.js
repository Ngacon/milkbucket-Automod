const test = require('node:test');
const assert = require('node:assert/strict');

const { ReactionRoleRepository } = require('../src/repositories/reaction-role-repo');

function createMockPool(responses) {
  const queries = [];
  const client = {
    async query(sql, params) {
      queries.push({
        sql: String(sql).trim(),
        params
      });

      const response = responses.shift();
      return response || { rows: [], rowCount: 0 };
    },
    releaseCalled: false,
    release() {
      this.releaseCalled = true;
    }
  };

  return {
    queries,
    client,
    async connect() {
      return client;
    }
  };
}

test('upsertReactionRole reports created when no existing mapping matches', async () => {
  const pool = createMockPool([
    {},
    { rows: [], rowCount: 0 },
    {
      rows: [
        {
          guild_id: '1',
          channel_id: '2',
          message_id: '3',
          role_id: '4',
          emoji: 'unicode:👍'
        }
      ],
      rowCount: 1
    },
    {}
  ]);
  const repo = new ReactionRoleRepository({ pool });

  const result = await repo.upsertReactionRole({
    guildId: '1',
    channelId: '2',
    messageId: '3',
    roleId: '4',
    emoji: 'unicode:👍',
    emojiAliases: ['unicode:👍', '👍']
  });

  assert.equal(result.created, true);
  assert.equal(result.entry.emoji, 'unicode:👍');
  assert.equal(pool.client.releaseCalled, true);
  assert.deepEqual(pool.queries[1].params, ['3', ['unicode:👍', '👍'], 'unicode:👍']);
});

test('upsertReactionRole reports updated and deletes legacy mappings first', async () => {
  const pool = createMockPool([
    {},
    {
      rows: [
        {
          guild_id: '1',
          channel_id: '2',
          message_id: '3',
          role_id: 'old-role',
          emoji: '<:milk:123456789012345678>'
        }
      ],
      rowCount: 1
    },
    { rows: [], rowCount: 1 },
    {
      rows: [
        {
          guild_id: '1',
          channel_id: '2',
          message_id: '3',
          role_id: 'new-role',
          emoji: 'custom:123456789012345678'
        }
      ],
      rowCount: 1
    },
    {}
  ]);
  const repo = new ReactionRoleRepository({ pool });

  const result = await repo.upsertReactionRole({
    guildId: '1',
    channelId: '2',
    messageId: '3',
    roleId: 'new-role',
    emoji: 'custom:123456789012345678',
    emojiAliases: ['custom:123456789012345678', '<:milk:123456789012345678>']
  });

  assert.equal(result.created, false);
  assert.equal(result.entry.role_id, 'new-role');
  assert.equal(pool.client.releaseCalled, true);
  assert.equal(pool.queries[2].params[0], '3');
  assert.deepEqual(pool.queries[2].params[1], [
    'custom:123456789012345678',
    '<:milk:123456789012345678>'
  ]);
});
