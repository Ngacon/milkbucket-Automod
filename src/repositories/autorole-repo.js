class AutoroleRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async getRole(guildId) {
    const result = await this.pool.query(
      `
        SELECT role_id
        FROM autorole_settings
        WHERE guild_id = $1
        LIMIT 1
      `,
      [guildId]
    );

    return result.rows[0]?.role_id || null;
  }

  async setRole(guildId, roleId) {
    const result = await this.pool.query(
      `
        INSERT INTO autorole_settings (guild_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          role_id = EXCLUDED.role_id,
          updated_at = NOW()
        RETURNING role_id
      `,
      [guildId, roleId]
    );

    return result.rows[0]?.role_id || null;
  }
}

module.exports = {
  AutoroleRepository
};
