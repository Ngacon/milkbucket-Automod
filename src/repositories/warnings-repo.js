class WarningsRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async addWarning({ guildId, userId, moderatorId, reason }) {
    const result = await this.pool.query(
      `
        INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `,
      [guildId, userId, moderatorId, reason || null]
    );

    return result.rows[0];
  }

  async getWarnings({ guildId, userId }) {
    const result = await this.pool.query(
      `
        SELECT id, moderator_id, reason, created_at
        FROM warnings
        WHERE guild_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 25
      `,
      [guildId, userId]
    );

    return result.rows;
  }

  async countWarningsWithinWindow({ guildId, userId, timeWindowSeconds }) {
    const result = await this.pool.query(
      `
        SELECT COUNT(*)::INT AS total
        FROM warnings
        WHERE guild_id = $1
          AND user_id = $2
          AND created_at > NOW() - ($3 * INTERVAL '1 second')
      `,
      [guildId, userId, timeWindowSeconds]
    );

    return result.rows[0]?.total || 0;
  }

  async clearWarnings({ guildId, userId }) {
    await this.pool.query(
      `
        DELETE FROM warnings
        WHERE guild_id = $1 AND user_id = $2
      `,
      [guildId, userId]
    );
  }

  async deleteWarning({ guildId, warningId }) {
    const result = await this.pool.query(
      `
        DELETE FROM warnings
        WHERE guild_id = $1 AND id = $2
        RETURNING id
      `,
      [guildId, warningId]
    );

    return result.rowCount > 0;
  }
}

module.exports = {
  WarningsRepository
};
