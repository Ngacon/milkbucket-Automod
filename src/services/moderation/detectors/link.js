const LINK_REGEX = /(https?:\/\/|www\.)/i;
const SOLO_MEDIA_URL_REGEX = /^\s*https?:\/\/[\S]+\.(?:gif|jpe?g|png|webp|bmp|svg|apng)(?:\?[\S]*)?\s*$/i;
const SOLO_GIF_PAGE_URL_REGEX = /^\s*https?:\/\/(?:www\.)?(?:giphy\.com|tenor\.com|tenor\.co|media\.giphy\.com|media\.tenor\.com|c\.tenor\.com)(?:[\/\?][\S]*)?\s*$/i;

module.exports = {
  name: 'link',
  type: 'automod',
  async check(ctx) {
    if (ctx.kind !== 'message' || !ctx.config.enabled || !ctx.config.rules.link) {
      return null;
    }

    if (!ctx.message || ctx.message.author?.bot || ctx.message.webhookId) {
      return null;
    }

    const content = String(ctx.message.content || '');
    if (!LINK_REGEX.test(content)) {
      return null;
    }

    if (SOLO_MEDIA_URL_REGEX.test(content) || SOLO_GIF_PAGE_URL_REGEX.test(content)) {
      return null;
    }

    return {
      triggered: true,
      severity: 2,
      reason: 'Gửi link',
      flags: {
        autowarn: true,
        delete: true,
        escalate: true
      },
      meta: {}
    };
  }
};
