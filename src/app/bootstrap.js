require('dotenv').config();

const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');
const { createLogger } = require('./logger');
const { installGlobalExceptionHandlers } = require('./exception-handler');
const { createRouter, loadCommandsFromDirectory } = require('./router');
const { createAutomodService } = require('./automod-service');
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

  const redis = createRedis(redisLogger);
  await initializeRedis(redis);

  const guildSettingsRepo = new GuildSettingsRepository({
    pool,
    redis,
    logger: logger.child('guild-settings-repo')
  });

  const warningsRepo = new WarningsRepository({ pool });
  const automodRepo = new AutomodRepository({ pool });
  const autoroleRepo = new AutoroleRepository({ pool });
  const reactionRoleRepo = new ReactionRoleRepository({ pool });

  const repos = {
    guildSettingsRepo,
    warningsRepo,
    automodRepo,
    autoroleRepo,
    reactionRoleRepo
  };

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
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

  const automodService = createAutomodService({
    automodRepo,
    guildSettingsRepo,
    i18n,
    redis,
    logger: logger.child('automod')
  });

  registerMessageCreateEvent({
    client,
    router,
    automodService,
    logger: logger.child('events:messageCreate')
  });

  registerGuildMemberAddEvent({
    client,
    autoroleRepo,
    logger: logger.child('events:guildMemberAdd')
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

  client.once('ready', () => {
    logger.info('Discord client is ready', {
      app: APP_NAME,
      userTag: client.user?.tag || null,
      guildCount: client.guilds.cache.size,
      locales: i18n.getAvailableLocales()
    });
  });

  const shutdown = async (signal) => {
    logger.warn('Shutdown signal received', { signal });

    try {
      client.destroy();
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

  await client.login(process.env.DISCORD_TOKEN);

  return {
    client,
    pool,
    redis,
    router
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
