class ReactionRoleRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async addReactionRole({ guildId, channelId, messageId, roleId, emoji }) {
    await this.pool.query(
      `
        INSERT INTO reaction_roles (guild_id, channel_id, message_id, role_id, emoji)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (message_id, emoji) DO NOTHING
      `,
      [guildId, channelId, messageId, roleId, emoji]
    );
  }

  async getByMessage(messageId) {
    const result = await this.pool.query(
      `
        SELECT guild_id, channel_id, message_id, role_id, emoji
        FROM reaction_roles
        WHERE message_id = $1
      `,
      [messageId]
    );

    return result.rows;
  }
}

module.exports = {
  ReactionRoleRepository
};
