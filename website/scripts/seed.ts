// Seed script: populate the dashboard with realistic mock data for
// the milkbucket bot on guild 1382898536265289809.
import { db } from '../src/lib/db'

const GUILD_ID = '1382898536265289809'
const GUILD_NAME = 'Milkbucket Community'

const MEMBER_POOL = [
  { id: '201005938472939521', username: 'linhtran',    display: 'Linh Trần',     roles: ['Admin', 'Mod'] },
  { id: '332099847732193290', username: 'quocnguyen',  display: 'Quốc Nguyễn',   roles: ['Mod'] },
  { id: '472309857320994857', username: 'minhle',      display: 'Minh Lê',       roles: ['Member'] },
  { id: '593028475302985730', username: 'phuongvo',    display: 'Phương Võ',     roles: ['Member'] },
  { id: '638201948573029485', username: 'trungdo',     display: 'Trung Đỗ',      roles: ['VIP'] },
  { id: '720394857320995830', username: 'hainguyen',   display: 'Hải Nguyễn',    roles: ['Member'] },
  { id: '830294857320994857', username: 'thanhpham',   display: 'Thanh Phạm',    roles: ['Member'] },
  { id: '930201948573029584', username: 'tuanvo',      display: 'Tuấn Võ',       roles: ['Member'] },
  { id: '104829385730294857', username: 'anhdao',      display: 'Anh Đào',       roles: ['VIP', 'Booster'] },
  { id: '115820394857302948', username: 'binhle',      display: 'Bình Lê',       roles: ['Member'] },
  { id: '126930294857302948', username: 'cuongtran',   display: 'Cường Trần',    roles: ['Member'] },
  { id: '137940294857302948', username: 'dungpham',    display: 'Dũng Phạm',     roles: ['Member'] },
  { id: '148950392019485730', username: 'embui',       display: 'Em Bùi',        roles: ['Member'] },
  { id: '159830294857302948', username: 'frostbyte',   display: 'FrostByte',     roles: ['Booster'] },
  { id: '160730294857302948', username: 'giangnguyen', display: 'Giang Nguyễn',  roles: ['Member'] },
  { id: '171840294857302948', username: 'hoangpham',   display: 'Hoàng Phạm',    roles: ['Member'] },
  { id: '182950294857302948', username: 'imreal',      display: 'I Am Real',     roles: ['Member'] },
  { id: '193060392019485730', username: 'jackyy',      display: 'Jackyy',        roles: ['Member'] },
  { id: '204829385730294857', username: 'khanhdo',     display: 'Khánh Đỗ',      roles: ['Member'] },
  { id: '215820394857302948', username: 'liennguyen',  display: 'Liên Nguyễn',   roles: ['Member'] },
]

const MODS = ['201005938472939521', '332099847732193290']

const BAD_WORDS_POOL = [
  'fuck', 'shit', 'dm', 'vcl', 'lồn', 'đĩ', 'địt', 'cc', 'clmm', 'vl',
  'stupid', 'idiot', 'bitch', 'asshole', 'wtf', 'dick', 'pussy', 'cunt',
]

const REACTION_ROLE_DEFS = [
  { emoji: '👍',  roleName: 'Announcements', roleId: '1382898536265289811' },
  { emoji: '🎮',  roleName: 'Gamer',         roleId: '1382898536265289812' },
  { emoji: '🎬',  roleName: 'Movie Night',   roleId: '1382898536265289813' },
  { emoji: '🎨',  roleName: 'Artist',        roleId: '1382898536265289814' },
  { emoji: '📚',  roleName: 'Study Group',   roleId: '1382898536265289815' },
  { emoji: '🎵',  roleName: 'Music',         roleId: '1382898536265289816' },
  { emoji: '🔥',  roleName: 'Booster',       roleId: '1382898536265289817' },
  { emoji: '🛒',  roleName: 'Marketplace',   roleId: '1382898536265289818' },
]

const COMMAND_CATEGORIES = [
  { cat: 'admin',    commands: ['ban', 'softban', 'hackban', 'kick', 'mute', 'timeout', 'warn', 'clear', 'lock', 'lockdown', 'nuke'] },
  { cat: 'automod',  commands: ['automod', 'antilink', 'antiinvite', 'antispam', 'antidup', 'anticaps', 'antimention', 'addword', 'delword', 'automod setwarn'] },
  { cat: 'channels', commands: ['move channel', 'set nsfw', 'channel create', 'channel delete', 'channel rename'] },
  { cat: 'roles',    commands: ['role add', 'role remove', 'role create', 'reaction role', 'reaction role list', 'reaction role remove', 'reaction role sync'] },
  { cat: 'info',     commands: ['help', 'serverinfo', 'userinfo', 'roleinfo', 'channelinfo'] },
  { cat: 'utility',  commands: ['prefix', 'language', 'ping', 'stats', 'avatar', 'embed'] },
  { cat: 'fun',      commands: ['8ball', 'roll', 'flip', 'meme', 'joke', 'fact'] },
  { cat: 'system',   commands: ['uptime', 'shard', 'restart', 'eval', 'reload'] },
]

const AUTOMOD_FEATURES = [
  { feature: 'antilink',    enabled: true,  threshold: 0, action: 'delete', warnLimit: 3 },
  { feature: 'antiinvite',  enabled: true,  threshold: 0, action: 'delete', warnLimit: 2 },
  { feature: 'antispam',    enabled: true,  threshold: 5, action: 'timeout', warnLimit: 3 },
  { feature: 'antidup',     enabled: false, threshold: 3, action: 'warn', warnLimit: 3 },
  { feature: 'anticaps',    enabled: true,  threshold: 70, action: 'delete', warnLimit: 2 },
  { feature: 'antimention', enabled: true,  threshold: 5, action: 'warn', warnLimit: 3 },
]

const WARNING_REASONS = [
  'Spam tin nhắn trong kênh chung',
  'Dùng từ ngữ không phù hợp',
  'Đăng link mời server khác (vi phạm antilink)',
  'Mention spam nhiều người dùng',
  'Caps lock quá mức cho phép',
  'Vi phạm quy định kênh chính',
  'Off-topic trong kênh kỹ thuật',
  'Thái độ không tốt với thành viên khác',
  'Spam reactions trên tin nhắn',
  'Đăng nội dung 18+ ngoài kênh nsfw',
]

const MUTE_REASONS = [
  'Tiếp tục spam sau cảnh báo',
  'Cãi nhau với mod',
  'Quá 3 lần vi phạm automod trong ngày',
  'Spam ping @everyone',
  'Đăng link độc hại',
]

const BAN_REASONS = [
  'Đăng nội dung 18+ liên tục',
  'Scam thành viên trong server',
  'Spam ads qua DM',
  'Tấn công server (raid)',
  'Vi phạm nghiêm trọng nhiều lần',
]

const AUTOMOD_EVENT_TYPES = ['antilink', 'antiinvite', 'antispam', 'anticaps', 'antimention', 'antidup']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600 * 1000) }

async function seed() {
  console.log('Seeding milkbucket dashboard data...')

  await db.autoModEvent.deleteMany({ where: { guildId: GUILD_ID } })
  await db.commandLog.deleteMany({ where: { guildId: GUILD_ID } })
  await db.reactionRole.deleteMany({ where: { guildId: GUILD_ID } })
  await db.badWord.deleteMany({ where: { guildId: GUILD_ID } })
  await db.autoModConfig.deleteMany({ where: { guildId: GUILD_ID } })
  await db.ban.deleteMany({ where: { guildId: GUILD_ID } })
  await db.mute.deleteMany({ where: { guildId: GUILD_ID } })
  await db.warning.deleteMany({ where: { guildId: GUILD_ID } })
  await db.member.deleteMany({ where: { guildId: GUILD_ID } })
  await db.guild.deleteMany({ where: { id: GUILD_ID } })

  await db.guild.create({
    data: {
      id: GUILD_ID,
      name: GUILD_NAME,
      iconUrl: 'https://cdn.discordapp.com/embed/avatars/4.png',
      ownerId: '1382898536265289810',
      memberCount: 8427,
      channelCount: 47,
      roleCount: 23,
      prefix: 'm!',
      language: 'vi',
      joinedAt: new Date('2025-04-12T08:30:00Z'),
      logChannelId: '1382898536265289820',
    },
  })

  for (const m of MEMBER_POOL) {
    await db.member.create({
      data: {
        id: m.id,
        guildId: GUILD_ID,
        username: m.username,
        displayName: m.display,
        avatarUrl: `https://cdn.discordapp.com/embed/avatars/${randInt(0, 5)}.png`,
        bot: false,
        joinedAt: hoursAgo(randInt(24, 24 * 180)),
        roles: JSON.stringify(m.roles),
      },
    })
  }
  await db.member.create({
    data: {
      id: '1382898536265289810',
      guildId: GUILD_ID,
      username: 'milkbucket',
      displayName: 'Milkbucket Bot',
      avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png',
      bot: true,
      joinedAt: new Date('2025-04-12T08:30:00Z'),
      roles: JSON.stringify(['Bot']),
    },
  })

  for (const cfg of AUTOMOD_FEATURES) {
    await db.autoModConfig.create({
      data: { guildId: GUILD_ID, ...cfg },
    })
  }

  for (const w of BAD_WORDS_POOL) {
    await db.badWord.create({
      data: {
        guildId: GUILD_ID,
        word: w,
        severity: pick(['low', 'medium', 'high']),
        createdAt: hoursAgo(randInt(1, 24 * 30)),
      },
    })
  }

  const rrMessages = ['1382998536265289901', '1382998536265289902', '1382998536265289903']
  const rrChannels = ['1382898536265289830', '1382898536265289831', '1382898536265289832']
  for (let i = 0; i < REACTION_ROLE_DEFS.length; i++) {
    const def = REACTION_ROLE_DEFS[i]
    const batch = Math.floor(i / 3)
    await db.reactionRole.create({
      data: {
        guildId: GUILD_ID,
        messageId: rrMessages[batch],
        channelId: rrChannels[batch],
        emoji: def.emoji,
        roleId: def.roleId,
        roleName: def.roleName,
        revoked: false,
        syncStatus: pick(['synced', 'synced', 'synced', 'pending']),
        createdAt: hoursAgo(randInt(1, 24 * 14)),
      },
    })
  }

  for (let i = 0; i < 50; i++) {
    const target = pick(MEMBER_POOL.filter(m => !MODS.includes(m.id)))
    const mod = pick(MODS)
    await db.warning.create({
      data: {
        guildId: GUILD_ID,
        userId: target.id,
        moderatorId: mod,
        reason: pick(WARNING_REASONS),
        level: pick([1, 1, 1, 2, 2, 3]),
        createdAt: hoursAgo(randInt(1, 24 * 45)),
      },
    })
  }

  for (let i = 0; i < 15; i++) {
    const target = pick(MEMBER_POOL.filter(m => !MODS.includes(m.id)))
    const mod = pick(MODS)
    const dur = pick([300, 600, 1800, 3600, 7200, 21600, 86400])
    const created = hoursAgo(randInt(1, 24 * 30))
    const expires = new Date(created.getTime() + dur * 1000)
    await db.mute.create({
      data: {
        guildId: GUILD_ID,
        userId: target.id,
        moderatorId: mod,
        reason: pick(MUTE_REASONS),
        duration: dur,
        active: expires > new Date(),
        createdAt: created,
        expiresAt: expires,
      },
    })
  }

  for (let i = 0; i < 12; i++) {
    const target = pick(MEMBER_POOL.filter(m => !MODS.includes(m.id)))
    const mod = pick(MODS)
    await db.ban.create({
      data: {
        guildId: GUILD_ID,
        userId: target.id,
        moderatorId: mod,
        reason: pick(BAN_REASONS),
        soft: i % 5 === 0,
        hackban: i % 7 === 0,
        createdAt: hoursAgo(randInt(1, 24 * 60)),
      },
    })
  }

  for (let i = 0; i < 200; i++) {
    const catObj = pick(COMMAND_CATEGORIES)
    const cmd = pick(catObj.commands)
    const user = pick(MEMBER_POOL)
    await db.commandLog.create({
      data: {
        guildId: GUILD_ID,
        commandName: cmd,
        category: catObj.cat,
        userId: user.id,
        username: user.username,
        args: Math.random() > 0.5 ? '@user reason' : '',
        success: Math.random() > 0.08,
        durationMs: randInt(15, 850),
        createdAt: hoursAgo(randInt(0, 24 * 14)),
      },
    })
  }

  for (let i = 0; i < 60; i++) {
    const user = pick(MEMBER_POOL.filter(m => !MODS.includes(m.id)))
    const feat = pick(AUTOMOD_EVENT_TYPES)
    await db.autoModEvent.create({
      data: {
        guildId: GUILD_ID,
        feature: feat,
        userId: user.id,
        username: user.username,
        action: pick(['delete', 'warn', 'timeout', 'mute']),
        content: pick([
          'discord.gg/abc123',
          'CHECK OUT MY CHANNEL!!!',
          'FREE NITRO CLICK HERE bit.ly/scam',
          'HELLO EVERYONE I AM HERE',
          '@everyone @here urgent',
          'spam spam spam spam spam',
        ]),
        createdAt: hoursAgo(randInt(0, 24 * 7)),
      },
    })
  }

  console.log('Seed complete.')
  const counts = {
    members: await db.member.count({ where: { guildId: GUILD_ID } }),
    warnings: await db.warning.count({ where: { guildId: GUILD_ID } }),
    mutes: await db.mute.count({ where: { guildId: GUILD_ID } }),
    bans: await db.ban.count({ where: { guildId: GUILD_ID } }),
    automodEvents: await db.autoModEvent.count({ where: { guildId: GUILD_ID } }),
    commandLogs: await db.commandLog.count({ where: { guildId: GUILD_ID } }),
    reactionRoles: await db.reactionRole.count({ where: { guildId: GUILD_ID } }),
    badWords: await db.badWord.count({ where: { guildId: GUILD_ID } }),
  }
  console.log(counts)
}

seed()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
