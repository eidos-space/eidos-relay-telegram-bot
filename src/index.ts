// Eidos Relay Telegram Bot
// Cloudflare Worker entry point

import { Hono } from "hono";
import { cache } from "hono/cache";
import type { Env } from "./types";
import type { TelegramUpdate } from "./types";
import { handleUpdate } from "./handlers/webhook";
import { deleteWebhook, getFile, getFileUrl, getWebhookInfo, setWebhook } from "./telegram";

const app = new Hono<{ Bindings: Env }>();

// ─── Health check ────────────────────────────────────────────────────────────

app.get("/health", (c) => {
  return c.json({
    success: true,
    result: {
      status: "healthy",
      service: "eidos-relay-telegram-bot",
      version: "1.0.0",
    },
  });
});

// ─── Webhook setup ───────────────────────────────────────────────────────────

/**
 * GET /setup
 * Registers this Worker URL as the Telegram webhook.
 * Call once after deploying: https://<your-worker>.workers.dev/setup
 */
app.get("/setup", async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return c.json({ success: false, error: "TELEGRAM_BOT_TOKEN not set" }, 500);
  }

  // Derive webhook URL from the incoming request URL
  const url = new URL(c.req.url);
  const webhookUrl = `${url.origin}/webhook`;

  const ok = await setWebhook(token, webhookUrl);
  return c.json({
    success: ok,
    result: ok ? { webhook_url: webhookUrl } : null,
    error: ok ? null : "Failed to set webhook. Check TELEGRAM_BOT_TOKEN.",
  });
});

/**
 * GET /setup/info
 * Returns current webhook info from Telegram.
 */
app.get("/setup/info", async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return c.json({ success: false, error: "TELEGRAM_BOT_TOKEN not set" }, 500);
  }
  const info = await getWebhookInfo(token);
  return c.json({ success: true, result: info });
});

/**
 * DELETE /setup
 * Removes the Telegram webhook.
 */
app.delete("/setup", async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return c.json({ success: false, error: "TELEGRAM_BOT_TOKEN not set" }, 500);
  }
  const ok = await deleteWebhook(token);
  return c.json({ success: ok });
});

// ─── Telegram webhook endpoint ───────────────────────────────────────────────

/**
 * POST /webhook
 * Receives incoming Telegram updates.
 */
app.post("/webhook", async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return c.json({ success: false }, 500);
  }

  let update: TelegramUpdate;
  try {
    update = await c.req.json<TelegramUpdate>();
  } catch {
    return c.json({ success: false, error: "Invalid JSON" }, 400);
  }

  // Process update asynchronously — respond to Telegram immediately
  c.executionCtx.waitUntil(handleUpdate(update, c.env));

  return c.json({ success: true });
});

// ─── File proxy ─────────────────────────────────────────────────────────────

/**
 * GET /file/:fileId
 * Resolves the file_id and redirects to the actual Telegram file URL.
 * Cached for 50 minutes to stay within Telegram's 1-hour URL validity.
 */
app.get(
  "/file/:fileId",
  cache({
    cacheName: "telegram-file-proxy",
    cacheControl: "max-age=3000",
  }),
  async (c) => {
    const token = c.env.TELEGRAM_BOT_TOKEN;
    const fileId = c.req.param("fileId");

    if (!token) {
      return c.json({ success: false, error: "TELEGRAM_BOT_TOKEN not set" }, 500);
    }

    const fileInfo = await getFile(token, fileId);
    if (!fileInfo?.file_path) {
      return c.json({ success: false, error: "File not found or too large" }, 404);
    }

    const fileUrl = getFileUrl(token, fileInfo.file_path);
    return c.redirect(fileUrl);
  }
);

export default app;
