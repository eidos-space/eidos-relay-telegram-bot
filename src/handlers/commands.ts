// Bot command handlers

import { sendMessage } from "../telegram";
import { deleteUserConfig, getUserConfig, setUserConfig } from "../config";
import type { Env, TelegramMessage, UserConfig } from "../types";

const HELP_TEXT = `
<b>Eidos Relay Bot — Commands</b>

/start — Show welcome message
/config &lt;relayId&gt; &lt;token&gt; — Set your Relay
/status — Show current configuration
/clear — Clear configuration
/help — Show this help

<b>Example:</b>
<code>/config my-relay-id your-bearer-token</code>

After configuring, just send any message to forward it to your Relay queue.
`.trim();

const START_TEXT = `
👋 <b>Welcome to Eidos Relay Bot!</b>

This bot forwards your messages to your <b>Eidos Relay</b> queue for collection and processing.

<b>Get started:</b>
Use /config to set your Relay ID and Bearer token.

${HELP_TEXT}
`.trim();

export async function handleStart(msg: TelegramMessage, env: Env): Promise<void> {
  await sendMessage(env.TELEGRAM_BOT_TOKEN, msg.chat.id, START_TEXT, { parseMode: "HTML" });
}

export async function handleHelp(msg: TelegramMessage, env: Env): Promise<void> {
  await sendMessage(env.TELEGRAM_BOT_TOKEN, msg.chat.id, HELP_TEXT, { parseMode: "HTML" });
}

export async function handleConfig(
  msg: TelegramMessage,
  env: Env,
  args: string[],
): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN, msg.chat.id, "❌ 无法识别用户身份，请在私聊中使用本命令。");
    return;
  }

  if (args.length < 2) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      msg.chat.id,
      "❌ Not enough arguments.\n\nUsage: <code>/config &lt;relayId&gt; &lt;token&gt;</code>\n\nExample:\n<code>/config my-relay your-token</code>",
      { parseMode: "HTML" },
    );
    return;
  }

  const [relayId, token] = args;
  const config: UserConfig = { relayId, token };
  await setUserConfig(env, userId, config);

  // Mask the token for display
  const maskedToken = token.length > 8
    ? `${token.slice(0, 4)}${"*".repeat(token.length - 8)}${token.slice(-4)}`
    : "****";

  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    msg.chat.id,
    `✅ <b>Configuration saved!</b>\n\n` +
    `📦 Relay ID: <code>${relayId}</code>\n` +
    `🔑 Token: <code>${maskedToken}</code>\n\n` +
    `Now just send any message to forward it to your Relay queue.`,
    { parseMode: "HTML" },
  );
}

export async function handleStatus(msg: TelegramMessage, env: Env): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN, msg.chat.id, "❌ 无法识别用户身份。");
    return;
  }

  const config = await getUserConfig(env, userId);
  if (!config) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      msg.chat.id,
      "⚠️ No Relay configured yet. Use /config to set one.",
    );
    return;
  }

  const maskedToken = config.token.length > 8
    ? `${config.token.slice(0, 4)}${"*".repeat(config.token.length - 8)}${config.token.slice(-4)}`
    : "****";

  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    msg.chat.id,
    `📋 <b>Current configuration:</b>\n\n` +
    `📦 Relay ID: <code>${config.relayId}</code>\n` +
    `🔑 Token: <code>${maskedToken}</code>`,
    { parseMode: "HTML" },
  );
}

export async function handleClear(msg: TelegramMessage, env: Env): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) {
    await sendMessage(env.TELEGRAM_BOT_TOKEN, msg.chat.id, "❌ 无法识别用户身份。");
    return;
  }

  await deleteUserConfig(env, userId);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    msg.chat.id,
    "🗑️ Configuration cleared.",
  );
}
