import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID || '1382898536265289809'

const COMMAND_META: Record<string, { category: string; description: string; permissions: string[]; cooldown: number; aliases: string[]; usage: string }> = {
  ban:              { category: 'admin',    description: 'Cấm một thành viên khỏi server',                        permissions: ['BanMembers'],         cooldown: 2, aliases: [],                 usage: 'ban @user [reason]' },
  softban:          { category: 'admin',    description: 'Ban rồi unban để xoá tin nhắn của user',                permissions: ['BanMembers'],         cooldown: 2, aliases: [],                 usage: 'softban @user [reason]' },
  hackban:          { category: 'admin',    description: 'Ban user chưa tham gia server bằng ID',                  permissions: ['BanMembers'],         cooldown: 2, aliases: [],                 usage: 'hackban <userId> [reason]' },
  kick:             { category: 'admin',    description: 'Đuổi một thành viên khỏi server',                        permissions: ['KickMembers'],        cooldown: 2, aliases: [],                 usage: 'kick @user [reason]' },
  mute:             { category: 'admin',    description: 'Mute thành viên (timeout) trong khoảng thời gian',       permissions: ['ModerateMembers'],    cooldown: 2, aliases: [],                 usage: 'mute @user <duration> [reason]' },
  timeout:          { category: 'admin',    description: 'Tương tự mute, áp dụng Discord timeout',                 permissions: ['ModerateMembers'],    cooldown: 2, aliases: [],                 usage: 'timeout @user <duration> [reason]' },
  warn:             { category: 'admin',    description: 'Cảnh báo một thành viên, lưu vào database',              permissions: ['ModerateMembers'],    cooldown: 2, aliases: [],                 usage: 'warn @user <reason>' },
  clear:            { category: 'admin',    description: 'Xoá một số lượng tin nhắn trong kênh',                   permissions: ['ManageMessages'],     cooldown: 3, aliases: ['purge'],          usage: 'clear <amount>' },
  lock:             { category: 'admin',    description: 'Khoá kênh hiện tại (chỉ mod gửi được tin)',              permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'lock [channel] [reason]' },
  lockdown:         { category: 'admin',    description: 'Khoá toàn bộ kênh trong server',                         permissions: ['ManageChannels','Administrator'], cooldown: 5, aliases: [],          usage: 'lockdown [reason]' },
  nuke:             { category: 'admin',    description: 'Xoá và tạo lại kênh để dọn sạch',                        permissions: ['ManageChannels'],     cooldown: 10, aliases: [],                 usage: 'nuke [channel]' },

  automod:          { category: 'automod',  description: 'Bật/tắt toàn bộ AutoMod hoặc xem trạng thái',            permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'automod [enable|disable|status]' },
  antilink:         { category: 'automod',  description: 'Chặn link ngoài trong tin nhắn',                          permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'antilink [on|off|threshold <n>]' },
  antiinvite:       { category: 'automod',  description: 'Chặn link mời server Discord',                            permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'antiinvite [on|off]' },
  antispam:         { category: 'automod',  description: 'Phát hiện spam dựa trên số tin nhắn trong khoảng thời gian', permissions: ['ManageGuild'],    cooldown: 2, aliases: [],                 usage: 'antispam [on|off|threshold <n>]' },
  antidup:          { category: 'automod',  description: 'Phát hiện tin nhắn trùng lặp',                            permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'antidup [on|off|threshold <n>]' },
  anticaps:         { category: 'automod',  description: 'Phát hiện tin nhắn quá nhiều chữ HOA',                    permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'anticaps [on|off|threshold <%>]' },
  antimention:      { category: 'automod',  description: 'Giới hạn số mention trong một tin nhắn',                  permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'antimention [on|off|threshold <n>]' },
  addword:          { category: 'automod',  description: 'Thêm từ cấm vào bad-word list',                           permissions: ['ManageGuild'],        cooldown: 1, aliases: [],                 usage: 'addword <word> [severity]' },
  delword:          { category: 'automod',  description: 'Xoá từ cấm khỏi bad-word list',                           permissions: ['ManageGuild'],        cooldown: 1, aliases: [],                 usage: 'delword <word>' },
  'automod setwarn':{ category: 'automod',  description: 'Cấu hình số lần vi phạm trước khi auto-warn',             permissions: ['ManageGuild'],        cooldown: 2, aliases: [],                 usage: 'automod setwarn <feature> <count>' },

  'move channel':   { category: 'channels', description: 'Di chuyển kênh sang category khác',                       permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'move channel <channel> <category>' },
  'set nsfw':       { category: 'channels', description: 'Bật/tắt NSFW cho kênh',                                   permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'set nsfw <channel> [on|off]' },
  'channel create': { category: 'channels', description: 'Tạo kênh mới (text/voice)',                               permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'channel create <type> <name>' },
  'channel delete': { category: 'channels', description: 'Xoá kênh hiện tại hoặc được chỉ định',                    permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'channel delete <channel>' },
  'channel rename': { category: 'channels', description: 'Đổi tên kênh',                                            permissions: ['ManageChannels'],     cooldown: 2, aliases: [],                 usage: 'channel rename <channel> <newName>' },

  'role add':       { category: 'roles',    description: 'Cấp role cho một thành viên',                             permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'role add @user <role>' },
  'role remove':    { category: 'roles',    description: 'Gỡ role khỏi thành viên',                                 permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'role remove @user <role>' },
  'role create':    { category: 'roles',    description: 'Tạo role mới trong server',                               permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'role create <name> [color]' },
  'reaction role':  { category: 'roles',    description: 'Thêm reaction role vào tin nhắn',                          permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'reaction role <messageId> <emoji> <role>' },
  'reaction role list': { category: 'roles',description: 'Liệt kê reaction role của một tin nhắn',                   permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'reaction role list <messageLink|messageId>' },
  'reaction role remove': { category: 'roles', description: 'Gỡ reaction role khỏi tin nhắn',                       permissions: ['ManageRoles'],        cooldown: 2, aliases: [],                 usage: 'reaction role remove <messageLink|messageId> <emoji> [--revoke]' },
  'reaction role sync': { category: 'roles',description: 'Đồng bộ reaction role với reactions hiện tại',            permissions: ['ManageRoles'],        cooldown: 5, aliases: [],                 usage: 'reaction role sync <messageLink|messageId>' },

  help:             { category: 'info',     description: 'Hiển thị menu trợ giúp với sidebar danh mục',             permissions: [],                     cooldown: 3, aliases: ['h','commands'],  usage: 'help [command|category]' },
  serverinfo:       { category: 'info',     description: 'Thông tin tổng quan về server',                           permissions: [],                     cooldown: 3, aliases: ['si','guildinfo'],usage: 'serverinfo' },
  userinfo:         { category: 'info',     description: 'Thông tin chi tiết của thành viên',                        permissions: [],                     cooldown: 3, aliases: ['ui','whois'],    usage: 'userinfo [@user|userId]' },
  roleinfo:         { category: 'info',     description: 'Thông tin chi tiết của một role',                          permissions: [],                     cooldown: 3, aliases: ['ri'],            usage: 'roleinfo <role>' },
  channelinfo:      { category: 'info',     description: 'Thông tin chi tiết của một kênh',                          permissions: [],                     cooldown: 3, aliases: ['ci'],            usage: 'channelinfo [channel]' },

  prefix:           { category: 'utility',  description: 'Đặt prefix tùy chỉnh cho guild',                            permissions: ['ManageGuild'],        cooldown: 3, aliases: [],                 usage: 'prefix [newPrefix]' },
  language:         { category: 'utility',  description: 'Đặt ngôn ngữ bot (vi/en)',                                  permissions: ['ManageGuild'],        cooldown: 3, aliases: ['lang'],           usage: 'language <vi|en>' },
  ping:             { category: 'utility',  description: 'Kiểm tra độ trễ của bot',                                  permissions: [],                     cooldown: 2, aliases: ['latency'],        usage: 'ping' },
  stats:            { category: 'utility',  description: 'Thống kê hoạt động bot trong server',                       permissions: [],                     cooldown: 5, aliases: ['botinfo'],        usage: 'stats' },
  avatar:           { category: 'utility',  description: 'Hiển thị avatar của thành viên',                            permissions: [],                     cooldown: 3, aliases: ['av','pfp'],       usage: 'avatar [@user|userId]' },
  embed:            { category: 'utility',  description: 'Tạo embed tùy chỉnh từ JSON',                              permissions: ['ManageMessages'],     cooldown: 3, aliases: [],                 usage: 'embed <json>' },

  '8ball':          { category: 'fun',      description: 'Hỏi cầu trả lời ngẫu nhiên',                               permissions: [],                     cooldown: 2, aliases: ['8b'],             usage: '8ball <question>' },
  roll:             { category: 'fun',      description: 'Tung xúc xắc',                                             permissions: [],                     cooldown: 2, aliases: ['dice'],           usage: 'roll [sides]' },
  flip:             { category: 'fun',      description: 'Tung đồng xu',                                             permissions: [],                     cooldown: 2, aliases: ['coinflip'],       usage: 'flip' },
  meme:             { category: 'fun',      description: 'Lấy meme ngẫu nhiên',                                      permissions: [],                     cooldown: 5, aliases: [],                 usage: 'meme' },
  joke:             { category: 'fun',      description: 'Lấy joke ngẫu nhiên',                                      permissions: [],                     cooldown: 5, aliases: [],                 usage: 'joke' },
  fact:             { category: 'fun',      description: 'Lấy fun fact ngẫu nhiên',                                  permissions: [],                     cooldown: 5, aliases: [],                 usage: 'fact' },

  uptime:           { category: 'system',   description: 'Thời gian bot đã chạy',                                    permissions: [],                     cooldown: 2, aliases: [],                 usage: 'uptime' },
  shard:            { category: 'system',   description: 'Thông tin shard',                                          permissions: [],                     cooldown: 2, aliases: [],                 usage: 'shard' },
  restart:          { category: 'system',   description: 'Restart bot (owner only)',                                 permissions: [],                     cooldown: 30, aliases: [],                 usage: 'restart' },
  eval:             { category: 'system',   description: 'Evaluate code (owner only)',                               permissions: [],                     cooldown: 5, aliases: [],                 usage: 'eval <code>' },
  reload:           { category: 'system',   description: 'Reload command (owner only)',                              permissions: [],                     cooldown: 2, aliases: [],                 usage: 'reload <command>' },
}

export async function GET() {
  const guild = await db.guild.findUnique({ where: { id: GUILD_ID } })
  const prefix = guild?.prefix || 'm!'

  // Pull usage counts from CommandLog
  const allLogs = await db.commandLog.findMany({ where: { guildId: GUILD_ID }, select: { commandName: true, success: true } })
  const usageMap: Record<string, { count: number; success: number; fail: number }> = {}
  for (const log of allLogs) {
    if (!usageMap[log.commandName]) usageMap[log.commandName] = { count: 0, success: 0, fail: 0 }
    usageMap[log.commandName].count++
    if (log.success) usageMap[log.commandName].success++
    else usageMap[log.commandName].fail++
  }

  // Group commands by category
  const categoriesMap: Record<string, unknown[]> = {}
  for (const [name, meta] of Object.entries(COMMAND_META)) {
    if (!categoriesMap[meta.category]) categoriesMap[meta.category] = []
    const usage = usageMap[name] || { count: 0, success: 0, fail: 0 }
    categoriesMap[meta.category].push({
      name,
      ...meta,
      usage: prefix + name,
      stats: usage,
    })
  }

  return NextResponse.json({
    prefix,
    categories: categoriesMap,
    totalCommands: Object.keys(COMMAND_META).length,
    totalCategories: Object.keys(categoriesMap).length,
  })
}
