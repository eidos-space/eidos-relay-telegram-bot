// Telegram Bot API helpers

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * Send a text message via the Telegram Bot API.
 */
export async function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
  options: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    replyToMessageId?: number;
  } = {},
): Promise<void> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };
  if (options.parseMode) body.parse_mode = options.parseMode;
  if (options.replyToMessageId) body.reply_to_message_id = options.replyToMessageId;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Telegram sendMessage failed: ${err}`);
  }
}

/**
 * Register the webhook URL with Telegram.
 */
export async function setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  return data.ok;
}

/**
 * Set a reaction emoji on a message (Telegram Bot API setMessageReaction).
 * Only works in private chats or if the bot is an admin in groups.
 */
export async function setMessageReaction(
  botToken: string,
  chatId: number,
  messageId: number,
  emoji: string,
): Promise<void> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/setMessageReaction`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reaction: [{ type: "emoji", emoji }],
      is_big: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Telegram setMessageReaction failed: ${err}`);
  }
}

/**
 * Delete the webhook (useful for cleanup / switching to polling).
 */
export async function deleteWebhook(botToken: string): Promise<boolean> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/deleteWebhook`;
  const res = await fetch(url, { method: "POST" });
  const data = (await res.json()) as { ok: boolean };
  return data.ok;
}

/**
 * Get current webhook info from Telegram.
 */
export async function getWebhookInfo(botToken: string): Promise<unknown> {
  const url = `${TELEGRAM_API_BASE}/bot${botToken}/getWebhookInfo`;
  const res = await fetch(url);
  return res.json();
}
