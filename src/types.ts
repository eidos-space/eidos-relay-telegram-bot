// Telegram Update and Message types (minimal for routing and reactions)

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  [key: string]: any; // Allow any other raw telegram fields (media, location, contacts, etc.)
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

// Env & user config types
export interface Env {
  USER_CONFIG: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
}

export interface UserConfig {
  channelId: string;
  token: string;
}
