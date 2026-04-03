async function deleteMessage(ctx) {
  if (!ctx.message?.deletable) {
    return false;
  }

  await ctx.message.delete().catch(() => null);
  return true;
}

module.exports = deleteMessage;
