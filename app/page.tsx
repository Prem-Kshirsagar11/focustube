"use client";
import StudySession from "@/components/StudySession";
import { useCallback, useEffect, useRef, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import PomodoroTimer from "@/components/PomodoroTimer";
import SessionModal from "@/components/SessionModal";
import TodoList from "@/components/TodoList";
import { extractVideoId, formatTime } from "@/lib/youtube";
import { loadSessions, upsertSession, deleteSession, saveSessions, Session } from "@/lib/sessions";
import { loadTimerDuration, saveTimerDuration } from "@/lib/storage";

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  pauseVideo(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}


export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [timerDuration, setTimerDuration] = useState(() => loadTimerDuration());

  const [secondsLeft, setSecondsLeft] = useState(timerDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [completedSessionDurations, setCompletedSessionDurations] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoTitle, setVideoTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const playerRef = useRef<YT.Player | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(timerDuration);
  const currentUrl = useRef("");
  const sessionNumberRef = useRef(1);
  const completedSessionsRef = useRef(0);
  const completedSessionDurationsRef = useRef<number[]>([]);

  useEffect(() => {
    if (activeTab !== "home") {
      try { playerRef.current?.pauseVideo(); } catch {}
    } else {
      setTimeout(() => { try { playerRef.current?.playVideo(); } catch {} }, 100);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      try {
        const player = playerRef.current as YTPlayer | null;
        const cur = player?.getCurrentTime?.() ?? 0;
        const dur = player?.getDuration?.() ?? 0;
        if (dur > 0) setVideoProgress(cur / dur);
      } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    secondsRef.current = timerDuration;
    setSecondsLeft(timerDuration);
  }, [timerDuration]);

  const doSaveSession = useCallback(() => {
    if (!currentUrl.current) return;
    try {
      const player = playerRef.current as YTPlayer | null;
      const cur = player?.getCurrentTime?.() ?? 0;
      const dur = player?.getDuration?.() ?? 0;
      const saved = upsertSession({
        url: currentUrl.current,
        title: videoTitle || currentUrl.current,
        timestamp: cur,
        secondsLeft: secondsRef.current,
        savedAt: new Date().toISOString(),
        videoProgress: dur > 0 ? cur / dur : 0,
        sessionNumber: sessionNumberRef.current,
        completedSessions: completedSessionsRef.current,
        completedSessionDurations: completedSessionDurationsRef.current,
      }, activeSessionId ?? undefined);
      setActiveSessionId(saved.id);
      setSessions(loadSessions());
    } catch {}
  }, [videoTitle, activeSessionId]);

  const onSessionEnd = useCallback(() => {
    stopTimer();
    try { playerRef.current?.pauseVideo(); } catch {}
    completedSessionsRef.current += 1;
    sessionNumberRef.current += 1;
    completedSessionDurationsRef.current = [...completedSessionDurationsRef.current, timerDuration];
    setCompletedSessions(completedSessionsRef.current);
    setSessionNumber(sessionNumberRef.current);
    setCompletedSessionDurations(completedSessionDurationsRef.current);
    doSaveSession();
    setShowModal(true);
  }, [stopTimer, doSaveSession, timerDuration]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1;
        secondsRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          onSessionEnd();
        }
        return next;
      });
    }, 1000);
  }, [onSessionEnd]);

  const handlePlay = useCallback(() => startTimer(), [startTimer]);

  const handlePause = useCallback(() => {
    stopTimer();
    doSaveSession();
  }, [stopTimer, doSaveSession]);

  async function fetchTitle(url: string): Promise<string> {
    const videoId = extractVideoId(url);
    if (!videoId) return url;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return url;
      const data = await res.json();
      return data.title || url;
    } catch { return url; }
  }

  async function handleLoad() {
    const id = extractVideoId(urlInput.trim());
    if (!id) { setError("Invalid YouTube URL. Please check and try again."); return; }
    setError("");
    currentUrl.current = urlInput.trim();
    stopTimer();
    resetTimer();
    sessionNumberRef.current = 1;
    completedSessionsRef.current = 0;
    completedSessionDurationsRef.current = [];
    setSessionNumber(1);
    setCompletedSessions(0);
    setCompletedSessionDurations([]);
    setShowModal(false);
    setActiveSessionId(null);
    setVideoProgress(0);
    const title = await fetchTitle(urlInput.trim());
    setVideoTitle(title);
    setVideoId(id);
  }

  function handleResume(session: Session) {
    const id = extractVideoId(session.url);
    if (!id) return;
    setUrlInput(session.url);
    currentUrl.current = session.url;
    setVideoTitle(session.title);
    setActiveSessionId(session.id);
    const savedSecs = session.secondsLeft ?? timerDuration;
    const ts = session.timestamp;
    stopTimer();
    secondsRef.current = savedSecs;
    setSecondsLeft(savedSecs);
    const restoredSessionNum = session.sessionNumber ?? 1;
    const restoredCompleted = session.completedSessions ?? 0;
    const restoredDurations = session.completedSessionDurations ?? [];
    sessionNumberRef.current = restoredSessionNum;
    completedSessionsRef.current = restoredCompleted;
    completedSessionDurationsRef.current = restoredDurations;
    setSessionNumber(restoredSessionNum);
    setCompletedSessions(restoredCompleted);
    setCompletedSessionDurations(restoredDurations);
    
    setShowModal(false);
    setVideoProgress(session.videoProgress ?? 0);
    setVideoId(null);
    setActiveTab("home");
    setTimeout(() => {
      setVideoId(id);
      setTimeout(() => {
        try { playerRef.current?.seekTo(ts, true); } catch {}
      }, 1500);
    }, 50);
  }

  function handleDeleteSession(id: string) {
    deleteSession(id);
    setSessions(loadSessions());
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setVideoId(null);
      stopTimer();
      resetTimer();
    }
  }

  function handleBreak() { setShowModal(false); resetTimer(); }

  function handleContinue() {
    setShowModal(false);
    resetTimer();
    setTimeout(() => { try { playerRef.current?.playVideo(); } catch {} }, 50);
  }

  function handleTimerDurationChange(newDuration: number) {
    saveTimerDuration(newDuration);
    setTimerDuration(newDuration);
    secondsRef.current = newDuration;
    setSecondsLeft(newDuration);
  }

  return (
    <div className="flex h-screen flex-col" style={{ background: "#000814" }}>

      {/* HEADER */}
      <header className="flex flex-shrink-0 items-center justify-between"
        style={{ borderBottom: "1px solid #002855", padding: "10px 24px" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #5390d9 0%, #0077b6 45%, #002855 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px #0077b644"
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polygon points="5,3 13,8 5,13" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.4px" }}>FocusTube</span>
        </div>

        {/* NAV */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "#001529", border: "1px solid #002855",
          borderRadius: 14, padding: "6px 8px"
        }}>
          {[
            { key: "home", label: "Home", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18V12"/></svg> },
            { key: "todo", label: "To-Do List", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg> },
            { key: "pending", label: "Incomplete Tasks", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/></svg> },
            { key: "sessions", label: "Study Sessions", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg> },
            { key: "misc", label: "Coming Soon", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg> },
          ].map(({ key, label, icon }) => {
            const isActive = key === activeTab;
            const showBadge = key === "pending" && sessions.length > 0;
            return (
              <button key={key} title={label} onClick={() => setActiveTab(key)}
                style={{
                  position: "relative", width: 38, height: 38, borderRadius: 10,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "linear-gradient(135deg, #0077b6cc, #002855)" : "transparent",
                  color: isActive ? "#00b4d8" : "#5390d966",
                  boxShadow: isActive ? "0 0 10px #0077b655, inset 0 0 8px #00b4d822" : "none",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => { if (isActive) return; e.currentTarget.style.background = "#0077b622"; e.currentTarget.style.color = "#4ea8de"; e.currentTarget.style.boxShadow = "0 0 12px #0077b644"; }}
                onMouseLeave={e => { if (isActive) return; e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5390d966"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {icon}
                {isActive && <span style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#00b4d8", boxShadow: "0 0 6px #00b4d8" }} />}
                {showBadge && <span suppressHydrationWarning style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: "#0077b6", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{sessions.length}</span>}
              </button>
            );
          })}
        </div>
        
      </header>

      {/* URL BAR */}
      {activeTab === "home" && (
        <div className="flex-shrink-0" style={{ background: "#000d1a", borderBottom: "1px solid #002855", padding: "12px 0 12px 24px" }}>
          <div style={{ display: "flex", gap: 8, width: 580, maxWidth: "calc(100% - 40px)" }}>
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLoad()}
              placeholder="Paste YouTube URL here..."
              style={{ flex: 1, borderRadius: 12, padding: "13px 16px", fontSize: 13, color: "#fff", background: "#002855", border: "1px solid #0077b633", fontFamily: "inherit" }}
            />
            <button onClick={handleLoad} style={{
              overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              border: "1px solid #005a8e", fontFamily: "inherit", letterSpacing: "1px", padding: "0 18px", width: 118, height: 48,
              fontSize: 13, textTransform: "uppercase", fontWeight: 600, borderRadius: 6, outline: "none",
              userSelect: "none", cursor: "pointer", transform: "translateY(0px)", position: "relative",
              boxShadow: `inset 0 30px 30px -15px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.15), 0 3px 0 #004f80, 0 3px 2px rgba(0,0,0,0.25), 0 6px 12px rgba(0,119,182,0.2), 0 10px 24px rgba(0,0,0,0.15)`,
              background: "linear-gradient(160deg, #4ea8de 0%, #0077b6 50%, #002855 100%)",
              color: "white", transition: "150ms all ease-in-out",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `inset 0 30px 30px -15px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.15), 0 3px 0 #004f80, 0 3px 2px rgba(0,0,0,0.25), 0 6px 20px rgba(0,180,216,0.45), 0 10px 28px rgba(0,0,0,0.2)`; }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = `inset 0 30px 30px -15px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.15), 0 3px 0 #004f80, 0 3px 2px rgba(0,0,0,0.25), 0 6px 12px rgba(0,119,182,0.2), 0 10px 24px rgba(0,0,0,0.15)`;
                const icon = e.currentTarget.querySelector(".btn-icon") as HTMLElement;
                const text = e.currentTarget.querySelector(".btn-text") as HTMLElement;
                if (icon) icon.style.transform = "translateX(0)";
                if (text) text.style.transform = "translateX(0)";
              }}
              onMouseMove={e => {
                const icon = e.currentTarget.querySelector(".btn-icon") as HTMLElement;
                const text = e.currentTarget.querySelector(".btn-text") as HTMLElement;
                if (icon) icon.style.transform = "translateX(26px)";
                if (text) text.style.transform = "translateX(140px)";
              }}
              onMouseOut={e => {
                const icon = e.currentTarget.querySelector(".btn-icon") as HTMLElement;
                const text = e.currentTarget.querySelector(".btn-text") as HTMLElement;
                if (icon) icon.style.transform = "translateX(0)";
                if (text) text.style.transform = "translateX(0)";
              }}
              onMouseDown={e => { e.currentTarget.style.transform = "translateY(3px)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "translateY(0px)"; }}
            >
              <svg className="btn-icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, marginRight: 8, flexShrink: 0, transition: "transform 0.5s ease-in-out" }}>
                <path fill="#ffffff" d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z"/>
              </svg>
              <span className="btn-text" style={{ transition: "transform 0.5s ease-in-out" }}>Load</span>
            </button>
          </div>
          {error && <p style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}>{error}</p>}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* HOME TAB — always mounted, hidden when on other tabs */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: activeTab === "home" ? "flex" : "none", alignItems: "center", justifyContent: "center", padding: 20, overflow: "hidden" }}>
          {videoId ? (
            <div style={{ width: "100%", maxWidth: 780, minWidth: 0 }}>
              <VideoPlayer key={videoId} videoId={videoId} onPlay={handlePlay} onPause={handlePause} playerRef={playerRef} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: 0.3 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 16 }}>
                <circle cx="28" cy="28" r="28" fill="#002855" />
                <polygon points="23,17 41,28 23,39" fill="#0077b6" />
              </svg>
              <p style={{ fontSize: 15, color: "#5390d9" }}>Paste a YouTube link above to begin</p>
              <p style={{ fontSize: 13, color: "#5390d9", marginTop: 4 }}>Your progress saves automatically</p>
              
            </div>
          )}
        </div>

        {/* TODO TAB */}
        {activeTab === "todo" && <TodoList />}

        {/* INCOMPLETE TASKS TAB */}
        {activeTab === "pending" && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ padding: "24px 32px 0", flexShrink: 0, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#4ea8de" }}>Incomplete Tasks</h2>
              <p style={{ fontSize: 12, color: "#5390d966", marginTop: 2 }}>
                {sessions.length} lecture{sessions.length !== 1 ? "s" : ""} in progress
              </p>
            </div>

            {sessions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, marginTop: 60, textAlign: "center" }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4ea8de" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/>
                </svg>
                <p style={{ fontSize: 14, color: "#5390d9" }}>No incomplete sessions found</p>
                <p style={{ fontSize: 12, color: "#5390d9", marginTop: 4 }}>Start watching a lecture and it will appear here</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {sessions.map(session => (
                    <div key={session.id} style={{
                      background: "linear-gradient(135deg, #000d1a 0%, #001222 100%)",
                      border: "1px solid #0077b633", borderTop: "2px solid #0077b6",
                      borderRadius: 14, padding: "18px 20px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                    }}>
                      {/* Title row */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                        {editingTitle && activeSessionId === session.id ? (
                          <input autoFocus value={editTitleVal}
                            onChange={e => setEditTitleVal(e.target.value)}
                            onBlur={() => {
                              if (editTitleVal.trim()) {
                                const updated = sessions.map(s => s.id === session.id ? { ...s, title: editTitleVal.trim() } : s);
                                setSessions(updated);

                                saveSessions(updated);
                              }
                              setEditingTitle(false);
                            }}
                            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            style={{ flex: 1, background: "#002855", border: "1px solid #0077b6", borderRadius: 8, padding: "5px 10px", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}
                          />
                        ) : (
                          <p style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#e8f4fd", lineHeight: 1.4 }}>
                            {session.title}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {/* Pencil */}
                          <button onClick={() => { setEditTitleVal(session.title); setEditingTitle(true); setActiveSessionId(session.id); }} title="Rename"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#5390d9" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#00b4d8")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#5390d9")}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {/* Delete */}
                          <button onClick={() => handleDeleteSession(session.id)} title="Delete"
                            style={{ background: "#2d0a0a", border: "1px solid #f8717133", borderRadius: 6, cursor: "pointer", padding: 4, color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 8px #f8717155"; e.currentTarget.style.borderColor = "#f87171"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#f8717133"; }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><rect x="5" y="6" width="14" height="14" rx="2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Video progress bar */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: "#5390d9", textTransform: "uppercase", letterSpacing: "0.1em" }}>Progress</span>
                          <span style={{ fontSize: 10, color: "#5390d966" }}>{Math.round((session.videoProgress ?? 0) * 100)}%</span>
                        </div>
                        <div style={{ width: "100%", height: 4, background: "#002855", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 4, width: `${Math.round((session.videoProgress ?? 0) * 100)}%`, background: "linear-gradient(90deg, #0077b6, #00b4d8)" }} />
                        </div>
                      </div>

                      {/* Link row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#002855", color: "#4ea8de", border: "1px solid #0077b633", flexShrink: 0 }}>Link</span>
                        <p style={{ flex: 1, fontSize: 11, color: "#5390d966", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.url}</p>
                        <button onClick={() => { navigator.clipboard.writeText(session.url); setCopied(session.id); setTimeout(() => setCopied(null), 2000); }} title="Copy link"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: copied === session.id ? "#00b4d8" : "#5390d9", flexShrink: 0, transition: "color .2s" }}>
                          {copied === session.id
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          }
                        </button>
                      </div>

                      {/* Footer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: 12, color: "#5390d9" }}>⏸ {formatTime(Math.floor(session.timestamp))}</p>
                          <p style={{ fontSize: 11, color: "#5390d944", marginTop: 2 }}>
                            {new Date(session.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button onClick={() => handleResume(session)}
                          style={{ borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#fff", background: "#0077b6", border: "none", cursor: "pointer", transition: "opacity .15s" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                          Resume →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
{/* SESSIONS TAB — always mounted */}
        <div style={{ display: activeTab === "sessions" ? "flex" : "none", flex: 1, minWidth: 0, overflow: "hidden" }}>
          <StudySession />
        </div>
        {/* MISC TAB */}
        {activeTab === "misc" && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ padding: "24px 32px 0", flexShrink: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#4ea8de" }}>Coming Soon</h2>
              <p style={{ fontSize: 12, color: "#5390d966", marginTop: 2 }}>New features on the way</p>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, textAlign: "center", padding: "0 32px 24px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ea8de" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <p style={{ fontSize: 14, color: "#5390d9" }}>Coming soon</p>
            </div>
          </div>
        )}

        {/* TIMER PANEL */}
        {videoId && activeTab === "home" && (
          <PomodoroTimer
            secondsLeft={secondsLeft}
            isRunning={isRunning}
            sessionNumber={sessionNumber}
            completedSessions={completedSessions}
            completedSessionDurations={completedSessionDurations}
            videoProgress={videoProgress}
            duration={timerDuration}
            onDurationChange={handleTimerDurationChange}
          />
        )}
      </div>

      {showModal && (
        <SessionModal sessionNumber={sessionNumber - 1} onBreak={handleBreak} onContinue={handleContinue} />
      )}
    </div>
  );
} 