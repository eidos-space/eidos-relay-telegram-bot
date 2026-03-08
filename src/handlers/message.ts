import { sendMessage, setMessageReaction } from "../telegram";
import { getUserConfig } from "../config";
import type { Env, TelegramMessage } from "../types";

interface RelayResponse {
  success?: boolean;
  errors?: Array<{ code?: string | number; message: string }>;
  result?: { id: string };
  error?: string;
  message?: string;
}

/**
 * Forward the raw Telegram message to the configured relay service.
 */
export async function forwardMessage(msg: TelegramMessage, env: Env): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) {
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
    return;
  }

  const config = await getUserConfig(env, userId);
  if (!config) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      msg.chat.id,
      "⚠️ Not configured yet. Use /config to set your Relay service.",
    );
    return;
  }

  // Build the relay payload nesting the raw telegram message.
  const payload = {
    body: {
      message: msg,
      source: "telegram",
      timestamp_ms: Date.now(),
    },
    contentType: "json",
    metadata: {
      telegram_chat_id: String(msg.chat.id),
      telegram_user_id: String(userId),
    },
  };

  const RELAY_URL = "https://api.eidos.space";
  const sendUrl = `${RELAY_URL}/v1/relay/channels/${config.channelId}/messages/send`;

  try {
    const relayRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    });

    const rawResText = await relayRes.text();
    let data: RelayResponse;
    try {
      data = JSON.parse(rawResText) as RelayResponse;
    } catch {
      await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
      return;
    }

    if (data.success === true || relayRes.status === 200 || relayRes.status === 201) {
      await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👌");
    } else {
      await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
    }
  } catch (err) {
    console.error("Relay fetch error:", err);
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
  }
}
