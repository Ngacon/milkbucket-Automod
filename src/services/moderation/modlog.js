const { buildEmbed } = require('../../app/embeds');
const { AUTOMOD_LOG_CHANNEL_ID, EMBED_COLORS } = require('../../config/constants');

async function resolveModlogChannel({ guild, repos, channelId }) {
  const resolvedChannelId =
    channelId ||
    (await repos?.automodRepo?.getModlogChannelId(guild.id)) ||
    AUTOMOD_LOG_CHANNEL_ID;

  if (!resolvedChannelId) {
    return null;
  }

  return (
    guild.channels.cache.get(resolvedChannelId) ||
    (await guild.channels.fetch(resolvedChannelId).catch(() => null))
  );
}

async function sendModerationLog({
  guild,
  repos,
  channelId,
  color = EMBED_COLORS.WARNING,
  title,
  description,
  fields = [],
  thumbnail,
  footerText,
  footerIcon
}) {
  const channel = await resolveModlogChannel({ guild, repos, channelId });
  if (!channel?.isTextBased()) {
    return false;
  }

  const sent = await channel
    .send({
      embeds: [
        buildEmbed({
          color,
          title,
          description,
          fields,
          thumbnail,
          footerText,
          footerIcon
        })
      ]
    })
    .catch(() => null);

  return Boolean(sent);
}

module.exports = {
  sendModerationLog,
  resolveModlogChannel
};
