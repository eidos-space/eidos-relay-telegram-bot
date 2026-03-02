// KV helpers for per-user relay configuration

import type { Env, UserConfig } from "./types";

const KV_PREFIX = "user:";

/**
 * Load a user's relay config from KV.
 * Returns null if not configured yet.
 */
export async function getUserConfig(env: Env, userId: number): Promise<UserConfig | null> {
  const raw = await env.USER_CONFIG.get(`${KV_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserConfig;
  } catch {
    return null;
  }
}

/**
 * Save a user's relay config to KV.
 */
export async function setUserConfig(env: Env, userId: number, config: UserConfig): Promise<void> {
  await env.USER_CONFIG.put(`${KV_PREFIX}${userId}`, JSON.stringify(config));
}

/**
 * Remove a user's relay config from KV.
 */
export async function deleteUserConfig(env: Env, userId: number): Promise<void> {
  await env.USER_CONFIG.delete(`${KV_PREFIX}${userId}`);
}
