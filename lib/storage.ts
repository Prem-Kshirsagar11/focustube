const KEY = "focustube_progress";
const DURATION_KEY = "focustube_timer_duration";

export interface SavedProgress {
  url: string;
  timestamp: number;
  savedAt: string;
  title?: string;
  secondsLeft?: number;
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.code === 22 || e.name === "QuotaExceededError")) {
      console.error("localStorage quota exceeded");
    }
    return false;
  }
}

export function saveProgress(url: string, timestamp: number, title?: string, secondsLeft?: number): void {
  const data: SavedProgress = { url, timestamp, savedAt: new Date().toISOString(), title, secondsLeft };
  safeSetItem(KEY, JSON.stringify(data));
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProgress;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  localStorage.removeItem(KEY);
}

export const DEFAULT_DURATION = 25 * 60;

export function saveTimerDuration(seconds: number): void {
  safeSetItem(DURATION_KEY, String(seconds));
}

export function loadTimerDuration(): number {
  try {
    const raw = localStorage.getItem(DURATION_KEY);
    if (!raw) return DEFAULT_DURATION;
    const parsed = parseInt(raw, 10);
    return parsed > 0 ? parsed : DEFAULT_DURATION;
  } catch {
    return DEFAULT_DURATION;
  }
}