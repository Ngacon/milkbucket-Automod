# milkbucket

## English

### Overview
`milkbucket` is a modular Discord bot built with Node.js, `discord.js`, PostgreSQL, and Redis.  
It is designed for medium-to-large servers that need moderation, automod, utility, channel management, role tools, and bilingual guild settings.

### Current Feature Set
- Prefix-based command router with auto-loading from `src/commands`
- Multi-word command aliases such as `role add`, `move channel`, and `set nsfw`
- Guild-level settings stored in PostgreSQL with Redis caching
- i18n with English and Vietnamese locale packs
- Moderation commands: `ban`, `softban`, `hackban`, `kick`, `mute`, `timeout`, `warn`, `clear`, `lock`, `lockdown`, `nuke`
- Automod commands: `automod`, `antilink`, `antiinvite`, `antispam`, `antidup`, `anticaps`, `antimention`, bad-word list management
- Role and channel management helpers
- Smart help system with category sidebar and command detail lookup

### Architecture
- `src/app`
  Core runtime, router, registry, embeds, logger, guards, validators, automod service
- `src/commands`
  Commands grouped by domain: `admin`, `automod`, `channels`, `roles`, `info`, `utility`, `fun`, `system`
- `src/database`
  PostgreSQL and Redis client initialization
- `src/repositories`
  Data access layer for guild settings, warnings, automod, autorole, reaction roles
- `src/events`
  Discord event wiring for messages, reactions, and member join flows
- `src/i18n`
  Translation files split by language and topic

### Command Design
Each command exports:

```js
module.exports = {
  meta: {
    name: 'ban',
    aliases: ['soft alias'],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'ban @user [reason]' }
  },
  execute: async (ctx) => {}
};
```

The router auto-loads command files and resolves:
- one-word commands
- multi-word commands
- aliases using spaces, dashes, or underscores

### Runtime Flow
1. Detect prefix
2. Parse message tokens
3. Resolve command from registry
4. Validate arguments
5. Check user and bot permissions
6. Execute command inside a safe wrapper
7. Reply using plain text or embed depending on context

### Supported Prefixes
- `m!`
- `m?`

Guilds can also set a custom prefix with the `prefix` command.

### Language Support
Supported locales:
- `vi`
- `en`

Use:

```text
m!language vi
m!language en
```

### Environment Variables
Copy `.env.example` to `.env` and fill in real values.

Required:
- `DISCORD_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`

Optional:
- `LOG_LEVEL`
- `AUTO_SYNC_SCHEMA`
- `ENABLE_REDIS_CACHE`
- `LOG_COMMANDS`
- `REDIS_KEY_PREFIX`
- `BOT_OWNER_IDS`
- `PG_POOL_MAX`
- `PG_IDLE_TIMEOUT_MS`
- `PG_CONNECT_TIMEOUT_MS`

AutoMod change protection:

```text
BOT_OWNER_IDS=123456789012345678,987654321098765432
```

Only the guild owner or IDs inside `BOT_OWNER_IDS` can change AutoMod settings such as `automod enable`, `anticaps`, `antispam`, `antilink`, `antimention`, `addword`, `delword`, and `automod setwarn`.

### Local Development

```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

### Notes
- The existing `.env` file was intentionally left untouched.
- `.env.example` has been restored as a safe template file.
- Commands are discovered automatically, so adding a new command usually means dropping a new file into `src/commands/<category>`.

---

## Tiếng Việt

### Tổng Quan
`milkbucket` là bot Discord dạng modular, viết bằng Node.js, `discord.js`, PostgreSQL và Redis.  
Bot hướng tới server vừa và lớn, cần hệ thống quản trị, automod, tiện ích, quản lý role/kênh và cài đặt ngôn ngữ theo từng guild.

### Tính Năng Hiện Tại
- Router lệnh prefix, tự động load toàn bộ command từ `src/commands`
- Hỗ trợ alias nhiều từ như `role add`, `move channel`, `set nsfw`
- Cài đặt guild lưu trong PostgreSQL, cache bằng Redis
- i18n song ngữ Anh và Việt
- Lệnh quản trị: `ban`, `softban`, `hackban`, `kick`, `mute`, `timeout`, `warn`, `clear`, `lock`, `lockdown`, `nuke`
- Lệnh automod: `automod`, `antilink`, `antiinvite`, `antispam`, `antidup`, `anticaps`, `antimention`, quản lý từ cấm
- Bộ công cụ quản lý role và kênh
- Help thông minh với sidebar chọn danh mục và tra cứu chi tiết lệnh

### Kiến Trúc
- `src/app`
  Runtime chính, router, registry, embed, logger, guards, validators, automod service
- `src/commands`
  Command chia theo nhóm: `admin`, `automod`, `channels`, `roles`, `info`, `utility`, `fun`, `system`
- `src/database`
  Khởi tạo PostgreSQL và Redis
- `src/repositories`
  Tầng truy cập dữ liệu cho guild settings, warnings, automod, autorole, reaction role
- `src/events`
  Nối các event Discord cho tin nhắn, reaction, member join
- `src/i18n`
  File dịch tách theo ngôn ngữ và chủ đề

### Thiết Kế Command
Mỗi command export theo dạng:

```js
module.exports = {
  meta: {
    name: 'ban',
    aliases: ['soft alias'],
    category: 'admin',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldown: 2,
    args: { min: 1, max: 10, usage: 'ban @user [reason]' }
  },
  execute: async (ctx) => {}
};
```

Router sẽ tự resolve:
- lệnh một từ
- lệnh nhiều từ
- alias có khoảng trắng, dấu gạch ngang, dấu gạch dưới

### Luồng Xử Lý
1. Nhận diện prefix
2. Parse token từ nội dung tin nhắn
3. Tìm command trong registry
4. Kiểm tra cú pháp
5. Kiểm tra quyền user và bot
6. Chạy command trong safe wrapper
7. Trả phản hồi bằng text thường hoặc embed tùy ngữ cảnh

### Prefix Được Hỗ Trợ
- `m!`
- `m?`

Mỗi guild cũng có thể đổi prefix riêng bằng lệnh `prefix`.

### Hỗ Trợ Ngôn Ngữ
Locale hiện có:
- `vi`
- `en`

Dùng lệnh:

```text
m!language vi
m!language en
```

### Biến Môi Trường
Hãy copy `.env.example` sang `.env` rồi điền giá trị thật.

Bắt buộc:
- `DISCORD_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`

Tùy chọn:
- `LOG_LEVEL`
- `AUTO_SYNC_SCHEMA`
- `ENABLE_REDIS_CACHE`
- `LOG_COMMANDS`
- `REDIS_KEY_PREFIX`
- `BOT_OWNER_IDS`
- `PG_POOL_MAX`
- `PG_IDLE_TIMEOUT_MS`
- `PG_CONNECT_TIMEOUT_MS`

Bảo vệ chỉnh sửa AutoMod:

```text
BOT_OWNER_IDS=123456789012345678,987654321098765432
```

Chỉ owner của server hoặc các ID nằm trong `BOT_OWNER_IDS` mới sửa được AutoMod, ví dụ `automod enable`, `anticaps`, `antispam`, `antilink`, `antimention`, `addword`, `delword`, `automod setwarn`.

### Chạy Local

```bash
npm install
npm run dev
```

Chạy production:

```bash
npm start
```

### Ghi Chú
- File `.env` cũ của bạn được giữ nguyên, không bị xóa.
- `.env.example` đã được thêm lại dưới dạng file mẫu an toàn.
- Vì command auto-load, nên thêm command mới thường chỉ cần bỏ thêm file vào `src/commands/<category>`.
