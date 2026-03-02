// Message forwarder: sends Telegram messages to the relay send API

import { sendMessage, setMessageReaction } from "../telegram";
import { getUserConfig } from "../config";
import type { Env, TelegramMessage } from "../types";

interface RelayResponse {
  success: boolean;
  errors?: Array<{ code?: number; message: string }>;
  result?: { id: string };
}

/**
 * Forward a Telegram message body to the configured relay service.
 */
export async function forwardMessage(msg: TelegramMessage, env: Env): Promise<void> {
  const userId = msg.from?.id;
  if (!userId) {
    console.log("No user ID found, reacting with 👎");
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

  const text = msg.text ?? msg.caption ?? "";
  const from = msg.from
    ? {
        id: msg.from.id,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
        username: msg.from.username,
      }
    : null;

  // Build the relay payload
  const payload = {
    body: {
      source: "telegram",
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      text,
      from,
      date: msg.date,
      timestamp_ms: msg.date * 1000,
    },
    contentType: "json",
    metadata: {
      telegram_chat_id: String(msg.chat.id),
      telegram_user_id: String(userId),
    },
  };

  const RELAY_URL = "https://api.eidos.space";
  const sendUrl = `${RELAY_URL}/v1/relays/${config.relayId}/messages/send`;

  let relayRes: Response;
  try {
    relayRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Relay fetch error:", err);
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
    return;
  }

  let data: RelayResponse;
  try {
    data = (await relayRes.json()) as RelayResponse;
  } catch {
    console.error("Relay returned invalid JSON");
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
    return;
  }

  console.log(`Relay response: success=${data.success}`);
  if (data.success) {
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👌");
  } else {
    console.error("Relay reported failure:", data.errors);
    await setMessageReaction(env.TELEGRAM_BOT_TOKEN, msg.chat.id, msg.message_id, "👎");
  }
}
