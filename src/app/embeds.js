const { EmbedBuilder } = require('discord.js');
const { APP_NAME, EMBED_COLORS } = require('../config/constants');

function buildEmbed(options = {}) {
  const footer = {
    text: options.footerText || APP_NAME
  };

  if (options.footerIcon) {
    footer.iconURL = options.footerIcon;
  }

  const embed = new EmbedBuilder()
    .setColor(options.color || EMBED_COLORS.PRIMARY)
    .setFooter(footer)
    .setTimestamp(options.timestamp || new Date());

  if (options.title) {
    embed.setTitle(options.title);
  }

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (Array.isArray(options.fields) && options.fields.length > 0) {
    embed.addFields(
      options.fields
        .filter((field) => field?.name && field?.value)
        .map((field) => ({
          name: String(field.name).slice(0, 256),
          value: String(field.value).slice(0, 1024),
          inline: Boolean(field.inline)
        }))
    );
  }

  if (options.author) {
    embed.setAuthor(options.author);
  }

  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail);
  }

  if (options.image) {
    embed.setImage(options.image);
  }

  if (options.url) {
    embed.setURL(options.url);
  }

  if (options.banner) {
    const bannerLine = String(options.banner).trim();
    const currentDescription = embed.data.description || '';
    embed.setDescription(
      currentDescription
        ? `${bannerLine}\n\n${currentDescription}`
        : bannerLine
    );
  }

  return embed;
}

module.exports = {
  buildEmbed
};
