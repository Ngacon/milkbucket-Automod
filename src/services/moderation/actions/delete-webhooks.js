async function deleteWebhooks(ctx) {
  if (!ctx.message?.webhookId || !ctx.message.channel?.fetchWebhooks) {
    return false;
  }

  const webhooks = await ctx.message.channel.fetchWebhooks().catch(() => null);
  const webhook = webhooks?.get(ctx.message.webhookId) || null;

  if (!webhook) {
    return false;
  }

  await webhook.delete('Unified moderation webhook spam cleanup').catch(() => null);
  return true;
}

module.exports = deleteWebhooks;
