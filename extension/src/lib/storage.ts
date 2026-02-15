import { ScrollStopSettings, DEFAULT_SETTINGS } from "./types";

const SETTINGS_KEY = "scrollstop_settings";
const USER_KEY = "scrollstop_user";
const TIME_TRACKING_KEY = "scrollstop_time_tracking";
const ONBOARDED_KEY = "scrollstop_onboarded";

// ---- Settings ----

export async function getSettings(): Promise<ScrollStopSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return result[SETTINGS_KEY] ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  settings: Partial<ScrollStopSettings>
): Promise<ScrollStopSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: updated });
  return updated;
}

// ---- User ----

export interface StoredUser {
  id: string;
  username: string;
  token: string;
}

export async function getUser(): Promise<StoredUser | null> {
  const result = await chrome.storage.local.get(USER_KEY);
  return result[USER_KEY] ?? null;
}

export async function saveUser(user: StoredUser): Promise<void> {
  await chrome.storage.local.set({ [USER_KEY]: user });
}

export async function clearUser(): Promise<void> {
  await chrome.storage.local.remove(USER_KEY);
}

// ---- Time Tracking ----

export interface TimeTrackingData {
  [domain: string]: {
    totalSeconds: number;
    lastActive: number; // timestamp
    blocked: boolean;
  };
}

export async function getTimeTracking(): Promise<TimeTrackingData> {
  const result = await chrome.storage.local.get(TIME_TRACKING_KEY);
  return result[TIME_TRACKING_KEY] ?? {};
}

export async function saveTimeTracking(data: TimeTrackingData): Promise<void> {
  await chrome.storage.local.set({ [TIME_TRACKING_KEY]: data });
}

export async function resetDomainTime(domain: string): Promise<void> {
  const data = await getTimeTracking();
  if (data[domain]) {
    data[domain].totalSeconds = 0;
    data[domain].blocked = false;
  }
  await saveTimeTracking(data);
}

// ---- Onboarding ----

export async function getOnboarded(): Promise<boolean> {
  const result = await chrome.storage.local.get(ONBOARDED_KEY);
  return result[ONBOARDED_KEY] ?? false;
}

export async function setOnboarded(): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDED_KEY]: true });
}
