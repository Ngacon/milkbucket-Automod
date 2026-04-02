class AutomodRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async getSettings(guildId) {
    const result = await this.pool.query(
      `
        SELECT *
        FROM automod_settings
        WHERE guild_id = $1
        LIMIT 1
      `,
      [guildId]
    );

    return (
      result.rows[0] || {
        guild_id: guildId,
        enabled: false,
        antilink: false,
        antiinvite: false,
        antispam: false,
        antidup: false,
        anticaps: false,
        antimention: 0,
        antiraid: false
      }
    );
  }

  async setToggle(guildId, field, value) {
    const validFields = [
      'enabled',
      'antilink',
      'antiinvite',
      'antispam',
      'antidup',
      'anticaps',
      'antiraid'
    ];

    if (!validFields.includes(field)) {
      throw new Error('Invalid automod field.');
    }

    const result = await this.pool.query(
      `
        INSERT INTO automod_settings (guild_id, ${field})
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          ${field} = EXCLUDED.${field},
          updated_at = NOW()
        RETURNING *
      `,
      [guildId, value]
    );

    return result.rows[0];
  }

  async setAntiMention(guildId, maxMentions) {
    const result = await this.pool.query(
      `
        INSERT INTO automod_settings (guild_id, antimention)
        VALUES ($1, $2)
        ON CONFLICT (guild_id)
        DO UPDATE SET
          antimention = EXCLUDED.antimention,
          updated_at = NOW()
        RETURNING *
      `,
      [guildId, maxMentions]
    );

    return result.rows[0];
  }

  async addWord(guildId, word) {
    await this.pool.query(
      `
        INSERT INTO automod_words (guild_id, word)
        VALUES ($1, $2)
        ON CONFLICT (guild_id, word) DO NOTHING
      `,
      [guildId, word]
    );
  }

  async removeWord(guildId, word) {
    await this.pool.query(
      `
        DELETE FROM automod_words
        WHERE guild_id = $1 AND word = $2
      `,
      [guildId, word]
    );
  }

  async listWords(guildId) {
    const result = await this.pool.query(
      `
        SELECT word
        FROM automod_words
        WHERE guild_id = $1
        ORDER BY word ASC
      `,
      [guildId]
    );

    return result.rows.map((row) => row.word);
  }
}

module.exports = {
  AutomodRepository
};
