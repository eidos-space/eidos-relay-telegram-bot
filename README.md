# Eidos Relay Telegram Bot

A Telegram bot running on Cloudflare Workers that forwards user messages to the [Eidos Relay Service](https://github.com/mayneyao/data-relay-service) message queue.

## Features

- 📨 Forward Telegram messages to the Relay service `/v1/relay/channels/{channelId}/messages/send` endpoint.
- 🔧 Per-user configuration for Channel ID and Bearer Token (stored in Cloudflare KV).
- 💬 Supports commands: `/start`, `/config`, `/status`, `/clear`, `/help`.
- 👌 Instant feedback using Telegram Reactions.

## Quick Start

### 1. Prerequisites

- [Cloudflare Account](https://cloudflare.com)
- [Telegram Bot Token](https://core.telegram.org/bots/tutorial) (Created via [@BotFather](https://t.me/BotFather))
- Node.js ≥ 20, pnpm ≥ 9

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create KV Namespace

```bash
# Production environment
wrangler kv namespace create USER_CONFIG
```

Copy the generated `id` and paste it into the `id` field of `USER_CONFIG` in `wrangler.toml`.

### 4. Set Bot Token (Secret)

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your Bot Token and press Enter
```

### 5. Deploy

```bash
pnpm run deploy
```

### 6. Register Telegram Webhook

Visit the following URL in your browser to register the webhook:

```
https://<your-worker-name>.<your-subdomain>.workers.dev/setup
```

---

## Bot Commands

| Command | Description |
|------|------|
| `/start` | Show welcome message |
| `/config <channelId> <token>` | Configure Channel (defaults to api.eidos.space) |
| `/status` | View current configuration |
| `/clear` | Clear configuration |
| `/help` | Show help |

### Usage Example

```
/config my-channel-id your-bearer-token
```

After configuration, simply send any text message. The bot will add an `👌` reaction to the message when successfully forwarded.

---

## Forwarded Message Format

The message body sent to the Relay Service follows this format:

```json
{
  "body": {
    "source": "telegram",
    "timestamp_ms": 1709385600000,
    "message": {
      "message_id": 42,
      "from": {
        "id": 987654321,
        "first_name": "Alice",
        "username": "alice"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1709385600,
      "text": "Hello, World!"
    }
  },
  "contentType": "json",
  "metadata": {
    "telegram_chat_id": "123456789",
    "telegram_user_id": "987654321"
  }
}
```

---

## Local Development

```bash
pnpm dev
```

Since Telegram Webhook cannot access `localhost` directly, it is recommended to use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose the local port, then manually call the `/setup` route to register the webhook.

---

## Project Structure

```
src/
├── index.ts             # Main entry, Hono app routes
├── types.ts             # Type definitions (Env, UserConfig, Telegram types)
├── telegram.ts          # Telegram Bot API utility functions
├── config.ts            # KV read/write utility functions
└── handlers/
    ├── webhook.ts       # Update dispatcher
    ├── commands.ts      # Command handlers (/start, /config, etc.)
    └── message.ts       # Message forwarding logic
```
