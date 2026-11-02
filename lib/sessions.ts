export interface Session {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  secondsLeft: number;
  savedAt: string;
  videoProgress: number;
  sessionNumber?: number;
  completedSessions?: number;
  completedSessionDurations?: number[];
}

const KEY = "focustube_sessions";

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch { return []; }
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

export function upsertSession(session: Omit<Session, "id">, existingId?: string): Session {
  const sessions = loadSessions();
  const idx = existingId
    ? sessions.findIndex(s => s.id === existingId)
    : sessions.findIndex(s => s.url === session.url);
  const id = idx >= 0 ? sessions[idx].id : crypto.randomUUID();
  const updated: Session = { ...session, id };
  if (idx >= 0) sessions[idx] = updated;
  else sessions.unshift(updated);
  safeSetItem(KEY, JSON.stringify(sessions));
  return updated;
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter(s => s.id !== id);
  safeSetItem(KEY, JSON.stringify(sessions));
}

export function saveSessions(sessions: Session[]): void {
  safeSetItem(KEY, JSON.stringify(sessions));
}