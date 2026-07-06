require('dotenv').config();

const http = require('node:http');
const path = require('node:path');
const { once } = require('node:events');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { createLogger } = require('./logger');
const { installGlobalExceptionHandlers } = require('./exception-handler');
const { createRouter, loadCommandsFromDirectory } = require('./router');
const { createModerationService } = require('../services/moderation/moderation-service');
const {
  createPostgres,
  initializePostgres,
  closePostgres
} = require('../database/postgres');
const {
  createRedis,
  initializeRedis,
  closeRedis
} = require('../database/redis');
const { GuildSettingsRepository } = require('../repositories/guild-settings-repo');
const { WarningsRepository } = require('../repositories/warnings-repo');
const { AutomodRepository } = require('../repositories/automod-repo');
const { AutoroleRepository } = require('../repositories/autorole-repo');
const { ReactionRoleRepository } = require('../repositories/reaction-role-repo');
const { registerMessageCreateEvent } = require('../events/message/message-create');
const { registerGuildMemberAddEvent } = require('../events/guild/guild-member-add');
const { registerReactionAddEvent } = require('../events/reaction/reaction-add');
const { registerReactionRemoveEvent } = require('../events/reaction/reaction-remove');
const i18n = require('../i18n');
const { APP_NAME } = require('../config/constants');
const { syncGuild, syncMember } = require('./dashboard-sync');

const logger = createLogger('bootstrap');

async function bootstrap() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('Missing DISCORD_TOKEN environment variable.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL environment variable.');
  }

  if (!process.env.REDIS_URL) {
    throw new Error('Missing REDIS_URL environment variable.');
  }

  const postgresLogger = logger.child('postgres');
  const redisLogger = logger.child('redis');
  const routerLogger = logger.child('router');

  const pool = createPostgres(postgresLogger);
  await initializePostgres(pool, postgresLogger);

  let redis;

  try {
    redis = createRedis(redisLogger);
    await initializeRedis(redis);
  } catch (error) {
    redisLogger.error('Redis initialization failed — continuing without Redis cache', { error });
    redis = null;
  }

  const guildSettingsRepo = new GuildSettingsRepository({
    pool,
    redis,
    logger: logger.child('guild-settings-repo')
  });

  const warningsRepo = new WarningsRepository({ pool });
  const automodRepo = new AutomodRepository({
    pool,
    redis,
    logger: logger.child('automod-repo')
  });
  const autoroleRepo = new AutoroleRepository({ pool });
  const reactionRoleRepo = new ReactionRoleRepository({ pool });

  const repos = {
    guildSettingsRepo,
    warningsRepo,
    automodRepo,
    autoroleRepo,
    reactionRoleRepo,
    pool
  };

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]
  });

  installGlobalExceptionHandlers({
    logger: logger.child('exceptions'),
    client
  });

  const commandsDirectory = path.join(__dirname, '..', 'commands');
  const commands = loadCommandsFromDirectory(commandsDirectory, logger.child('commands'));
  const router = createRouter({
    client,
    commands,
    guildSettingsRepo,
    i18n,
    logger: routerLogger,
    db: pool,
    redis,
    repos
  });

  const moderationService = createModerationService({
    client,
    i18n,
    redis,
    repos,
    logger: logger.child('automod')
  });

  registerMessageCreateEvent({
    client,
    router,
    moderationService,
    logger: logger.child('events:messageCreate')
  });

  registerGuildMemberAddEvent({
    client,
    moderationService,
    autoroleRepo,
    logger: logger.child('events:guildMemberAdd'),
    pool
  });

  registerReactionAddEvent({
    client,
    reactionRoleRepo,
    logger: logger.child('events:reactionAdd')
  });

  registerReactionRemoveEvent({
    client,
    reactionRoleRepo,
    logger: logger.child('events:reactionRemove')
  });

  const readyPromise = once(client, 'ready');

  client.once('ready', async () => {
    logger.info('Discord client is ready', {
      app: APP_NAME,
      userTag: client.user?.tag || null,
      guildCount: client.guilds.cache.size,
      locales: i18n.getAvailableLocales()
    });

    // Sync all guilds and members to shared dashboard tables
    for (const guild of client.guilds.cache.values()) {
      syncGuild(pool, guild);
      const members = await guild.members.fetch().catch(() => null);
      if (members) {
        for (const member of members.values()) {
          syncMember(pool, member);
        }
      }
    }
  });

  const shutdown = async (signal) => {
    logger.warn('Shutdown signal received', { signal });

    try {
      client.destroy();
      server?.close();
      await closeRedis(redis);
      await closePostgres(pool);
      logger.info('Shutdown completed');
    } catch (error) {
      logger.error('Shutdown failed', { error });
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  const ALLOWED_GUILD_ID = process.env.ALLOWED_GUILD_ID || '1382898536265289810';
  const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID || '1468253529268420688';

  const port = Number(process.env.BOT_PORT) || 3001;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname === '/api/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        online: true,
        startedAt: client.readyAt ? client.readyAt.toISOString() : new Date().toISOString(),
        uptimeMs: client.uptime || 0,
        ping: client.ws.ping,
        wsPing: client.ws.ping,
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpuPct: 0,
        version: require('../../package.json').version,
        nodeVersion: process.version,
        discordJsVersion: require('discord.js').version,
        shards: client.ws.shards ? Array.from(client.ws.shards.values()).map(s => ({
          id: s.id,
          status: s.status,
          ping: s.ping,
        })) : [],
        guilds: client.guilds.cache.size,
        commandsLoaded: commands ? commands.length : 0,
      }));
      return;
    }

    if (url.pathname === '/api/check-member' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const guildId = url.searchParams.get('guildId') || ALLOWED_GUILD_ID;

      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ allowed: false, error: 'Missing userId' }));
        return;
      }

      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ allowed: false, error: 'Guild not found' }));
          return;
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ allowed: false, reason: 'not_member' }));
          return;
        }

        const allowed = member.roles.cache.has(REQUIRED_ROLE_ID);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ allowed }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ allowed: false, error: 'Internal error' }));
      }
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${APP_NAME} is running.\n`);
  });

  await client.login(process.env.DISCORD_TOKEN);
  await readyPromise;

  server.listen(port, () => {
    logger.info('HTTP server listening', { port });
  });

  return {
    client,
    pool,
    redis,
    router,
    server
  };
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error('Bootstrap failed', { error });
    process.exit(1);
  });
}

module.exports = {
  bootstrap
};
