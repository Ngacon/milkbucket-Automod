const timeoutMember = require('./timeout');

async function muteMember(ctx, payload = {}) {
  const duration = payload.duration || 900;
  return timeoutMember(ctx, {
    ...payload,
    duration
  });
}

module.exports = muteMember;
