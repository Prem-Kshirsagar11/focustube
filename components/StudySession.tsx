"use client";

import { useMemo, useRef, useState } from "react";

interface SessionRecord {
  id: string;
  duration: number;
  date: string;
}

const KEY = "focustube_study_sessions";

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

function load(): SessionRecord[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(s: SessionRecord[]) { safeSetItem(KEY, JSON.stringify(s)); }

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
    : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function StudySession() {
  const [records, setRecords] = useState<SessionRecord[]>(() => load());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const grouped = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();
    const groups: { label: string; dateStr: string; items: SessionRecord[] }[] = [];
    records.forEach(r => {
      const d = new Date(r.date);
      const ds = d.toDateString();
      const label = ds === today ? "Today" : ds === yesterday ? "Yesterday"
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      const existing = groups.find(g => g.dateStr === ds);
      if (existing) existing.items.push(r);
      else groups.push({ label, dateStr: ds, items: [r] });
    });
    return groups;
  }, [records]);

  function start() {
    if (running) return;
    setRunning(true);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stop() {
    if (!running) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  }

  function finish() {
    stop();
    if (elapsed < 5) return;
    const rec: SessionRecord = { id: crypto.randomUUID(), duration: elapsed, date: new Date().toISOString() };
    const updated = [rec, ...records];
    setRecords(updated);
    save(updated);
    setElapsed(0);
  }

  function deleteRecord(id: string) {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    save(updated);
  }

  function clearAll() { setRecords([]); save([]); }

  const totalSecs = records.reduce((a, r) => a + r.duration, 0);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", height: "100%", overflow: "hidden" }}>

      {/* LEFT — session history */}
      <div style={{ flex: 1, minWidth: 0, padding: "24px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#4ea8de" }}>Study Sessions</h2>
            <p style={{ fontSize: 12, color: "#5390d966", marginTop: 2 }}>
              {records.length} sessions · {fmt(totalSecs)} total
            </p>
          </div>
          {records.length > 0 && (
            <button onClick={clearAll}
              style={{ background: "none", border: "1px solid #f8717133", borderRadius: 8, padding: "6px 14px", color: "#f8717188", fontSize: 12, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={e => (e.currentTarget.style.color = "#f8717188")}>
              Clear all
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div style={{ textAlign: "center", opacity: 0.3, marginTop: 60 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4ea8de" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/>
            </svg>
            <p style={{ fontSize: 13, color: "#5390d9" }}>No sessions yet</p>
          </div>
        ) : (
          grouped.map((group, groupIdx) => {
            const groupTotal = group.items.reduce((a, r) => a + r.duration, 0);
            const totalH = Math.floor(groupTotal / 3600);
            const totalM = Math.floor((groupTotal % 3600) / 60);
            const totalStr = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`;
            const groupStartIndex = records.length - grouped.slice(0, groupIdx + 1).flatMap(g => g.items).length;
            return (
              <div key={group.dateStr} style={{ marginBottom: 20 }}>
                {/* Day header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 10
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#4ea8de" }}>{group.label}</span>
                  <span style={{ fontSize: 11, color: "#5390d966" }}>
                    {group.items.length} session{group.items.length !== 1 ? "s" : ""} · {totalStr}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#002855" }} />
                </div>

                {/* Sessions */}
                {group.items.map((r, itemIdx) => {
                  const idx = groupStartIndex - itemIdx;
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", marginBottom: 8, borderRadius: 10,
                      background: "#000d1a", border: "1px solid #0077b622"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "#002855", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4ea8de" }}>
                          {idx}
                        </span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#e8f4fd", fontFamily: "monospace" }}>{fmt(r.duration)}</p>
                          <p style={{ fontSize: 11, color: "#5390d966", marginTop: 2 }}>
                            {new Date(r.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteRecord(r.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#f8717144", padding: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#f8717144")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="5" y="6" width="14" height="14" rx="2"/>
                        </svg>
                      </button>
                    </div>
                   );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* RIGHT — stopwatch panel */}
      <div style={{
        width: 220, flexShrink: 0, borderLeft: "1px solid #002855",
        background: "#000d1a", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24, padding: "28px 20px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "monospace", fontSize: 32, fontWeight: 700, letterSpacing: 3,
            color: running ? "#00b4d8" : "#4ea8de",
            textShadow: running ? "0 0 20px #00b4d855" : "none",
            transition: "color 0.3s, text-shadow 0.3s"
          }}>
            {fmt(elapsed)}
          </div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: running ? "#00b4d8aa" : "#5390d966", marginTop: 6 }}>
            {running ? "● Running" : elapsed > 0 ? "Paused" : "Ready"}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#4ea8de" }}>{records.length} Session{records.length !== 1 ? "s" : ""}</p>
          <p style={{ fontSize: 11, color: "#5390d944", marginTop: 4 }}>{fmt(totalSecs)} total</p>
        </div>

        <div style={{ width: "100%", height: 1, background: "#002855" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {/* Save Session — always takes space, hidden when not needed */}
          <button onClick={finish}
            style={{
              visibility: (elapsed > 0 && !running) ? "visible" : "hidden",
              background: "#001a0d", border: "1px solid #34d39944",
              borderRadius: 10, padding: "10px 0", color: "#34d399",
              fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%"
            }}>✓ Save Session</button>

          {/* Start / Pause / Resume — always in same position */}
          {running ? (
            <button onClick={stop} style={{
              background: "#001529", border: "1px solid #0077b6",
              borderRadius: 10, padding: "11px 0", color: "#4ea8de",
              fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%"
            }}>⏸ Pause</button>
          ) : (
            <button onClick={start} style={{
              background: "linear-gradient(135deg, #0077b6, #005a8e)", border: "none",
              borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: 13,
              fontWeight: 700, cursor: "pointer", width: "100%",
              boxShadow: "0 2px 12px rgba(0,119,182,0.4)"
            }}>{elapsed > 0 ? "▶ Resume" : "▶ Start"}</button>
          )}

          {/* Restart — always takes space, hidden when not needed */}
          <button onClick={() => setElapsed(0)}
            style={{
              visibility: (elapsed > 0 && !running) ? "visible" : "hidden",
              background: "#001529", border: "1px solid #0077b633",
              borderRadius: 10, padding: "10px 0", color: "#5390d9",
              fontSize: 13, cursor: "pointer", width: "100%"
            }}>↺ Restart</button>
        </div>
      </div>
    </div>
  );
}