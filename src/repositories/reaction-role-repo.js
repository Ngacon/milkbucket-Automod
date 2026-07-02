class ReactionRoleRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async getByMessage(messageId) {
    const result = await this.pool.query(
      `
        SELECT guild_id, channel_id, message_id, role_id, emoji, created_at
        FROM reaction_roles
        WHERE message_id = $1
        ORDER BY created_at ASC, emoji ASC
      `,
      [messageId]
    );

    return result.rows;
  }

  async getByMessageAndEmoji({ messageId, emojiValues, preferredEmoji }) {
    const lookupValues = [...new Set((emojiValues || []).filter(Boolean))];
    if (!messageId || lookupValues.length === 0) {
      return null;
    }

    const result = await this.pool.query(
      `
        SELECT guild_id, channel_id, message_id, role_id, emoji, created_at
        FROM reaction_roles
        WHERE message_id = $1
          AND emoji = ANY($2::text[])
        ORDER BY
          CASE WHEN emoji = $3 THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1
      `,
      [messageId, lookupValues, preferredEmoji || lookupValues[0]]
    );

    return result.rows[0] || null;
  }

  async upsertReactionRole({ guildId, channelId, messageId, roleId, emoji, emojiAliases = [] }) {
    const lookupValues = [...new Set([emoji, ...emojiAliases].filter(Boolean))];
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `
          SELECT guild_id, channel_id, message_id, role_id, emoji, created_at
          FROM reaction_roles
          WHERE message_id = $1
            AND emoji = ANY($2::text[])
          ORDER BY
            CASE WHEN emoji = $3 THEN 0 ELSE 1 END,
            created_at DESC
        `,
        [messageId, lookupValues, emoji]
      );

      if (existing.rowCount > 0) {
        await client.query(
          `
            DELETE FROM reaction_roles
            WHERE message_id = $1
              AND emoji = ANY($2::text[])
          `,
          [messageId, lookupValues]
        );
      }

      const result = await client.query(
        `
          INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (message_id, emoji)
          DO UPDATE SET
            guild_id = EXCLUDED.guild_id,
            channel_id = EXCLUDED.channel_id,
            role_id = EXCLUDED.role_id
          RETURNING guild_id, channel_id, message_id, role_id, emoji, created_at
        `,
        [guildId, channelId, messageId, roleId, emoji]
      );

      await client.query('COMMIT');

      return {
        created: existing.rowCount === 0,
        entry: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeReactionRole({ messageId, emojiValues, preferredEmoji }) {
    const lookupValues = [...new Set((emojiValues || []).filter(Boolean))];
    if (!messageId || lookupValues.length === 0) {
      return null;
    }

    const result = await this.pool.query(
      `
        DELETE FROM reaction_roles
        WHERE message_id = $1
          AND emoji = ANY($2::text[])
        RETURNING guild_id, channel_id, message_id, role_id, emoji, created_at
      `,
      [messageId, lookupValues]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return (
      result.rows.find((entry) => entry.emoji === preferredEmoji) ||
      result.rows[0]
    );
  }
}

module.exports = {
  ReactionRoleRepository
};
