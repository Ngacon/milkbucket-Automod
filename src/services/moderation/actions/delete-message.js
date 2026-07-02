async function deleteMessage(ctx) {
  if (!ctx.message?.deletable) {
    return false;
  }

  return ctx.message.delete().then(() => true).catch(() => false);
}

module.exports = deleteMessage;
