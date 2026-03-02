// Telegram webhook handler — routes updates to commands or message forwarder

import { handleClear, handleConfig, handleHelp, handleStart, handleStatus } from "./commands";
import { forwardMessage } from "./message";
import type { Env, TelegramMessage, TelegramUpdate } from "../types";

/**
 * Parse the command name and arguments from message text.
 * Returns null if the message is not a command.
 */
function parseCommand(text: string): { command: string; args: string[] } | null {
  if (!text.startsWith("/")) return null;
  // Strip bot @mention suffix (e.g. /start@mybotname)
  const [raw, ...rest] = text.split(/\s+/);
  const command = raw.split("@")[0].toLowerCase();
  return { command, args: rest };
}

/**
 * Dispatch a single incoming message to the appropriate handler.
 */
export async function handleMessage(msg: TelegramMessage, env: Env): Promise<void> {
  const text = msg.text ?? "";

  const parsed = parseCommand(text);
  if (parsed) {
    switch (parsed.command) {
      case "/start":
        await handleStart(msg, env);
        break;
      case "/help":
        await handleHelp(msg, env);
        break;
      case "/config":
        await handleConfig(msg, env, parsed.args);
        break;
      case "/status":
        await handleStatus(msg, env);
        break;
      case "/clear":
        await handleClear(msg, env);
        break;
      default:
        // Unknown command — ignore silently or inform the user
        break;
    }
    return;
  }

  // Non-command message: forward to relay
  await forwardMessage(msg, env);
}

/**
 * Process a Telegram Update object.
 */
export async function handleUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const msg = update.message ?? update.edited_message;
  if (!msg) return; // Ignore non-message updates (inline queries etc.)

  await handleMessage(msg, env);
}
