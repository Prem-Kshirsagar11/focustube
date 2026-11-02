import { formatTime } from "@/lib/youtube";
import { useState } from "react";

const CIRC = 439.82;

interface Props {
  secondsLeft: number;
  isRunning: boolean;
  sessionNumber: number;
  completedSessions: number;
  completedSessionDurations: number[];
  videoProgress: number;
  duration: number;
  onDurationChange: (seconds: number) => void;
}

export default function PomodoroTimer({ secondsLeft, isRunning, sessionNumber, completedSessions, completedSessionDurations, videoProgress, duration, onDurationChange }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [inputHours, setInputHours] = useState("");
  const [inputMins, setInputMins] = useState("");
  const [inputSecs, setInputSecs] = useState("");

  const pct = (duration - secondsLeft) / duration;
  const offset = +(CIRC * (1 - pct)).toFixed(2);

  const openSettings = () => {
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    const s = duration % 60;
    setInputHours(h > 0 ? h.toString() : "");
    setInputMins(m > 0 ? m.toString() : "");
    setInputSecs(s > 0 ? s.toString() : "");
    setShowSettings(true);
  };

  const handleSaveDuration = () => {
    const h = Math.max(0, parseInt(inputHours, 10) || 0);
    const m = Math.max(0, parseInt(inputMins, 10) || 0);
    const s = Math.max(0, parseInt(inputSecs, 10) || 0);
    const totalSecs = h * 3600 + m * 60 + s;
    if (totalSecs > 0) {
      onDurationChange(totalSecs);
    }
    setShowSettings(false);
  };

  const formatDurationDesc = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return `${parts.join(" ")} focus block`;
  };

  return (
    <div style={{
      width: 260, flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", gap: 20, padding: "24px 20px",
      background: "#000d1a", borderLeft: "1px solid #002855",
      overflowY: "auto", height: "100%"
    }}>
      {/* Ring */}
      <div style={{ position: "relative" }}>
        <svg width="164" height="164">
          <circle cx="82" cy="82" r="70" fill="none" stroke="#002855" strokeWidth="8" />
          <circle cx="82" cy="82" r="70" fill="none"
            stroke={isRunning ? "#00b4d8" : "#0077b6"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset}
            transform="rotate(-90 82 82)"
            style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{
            fontFamily: "monospace", fontSize: 28, fontWeight: 700, letterSpacing: 1,
            color: isRunning ? "#00b4d8" : "#4ea8de"
          }}>
            {formatTime(secondsLeft)}
          </span>
          <span style={{
            fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 4,
            color: isRunning ? "#00b4d8bb" : "#5390d9"
          }}>
            {isRunning ? "Focusing" : "Paused"}
          </span>
        </div>
      </div>

      {/* Session label */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#4ea8de" }}>Session {sessionNumber}</p>
        <p style={{ fontSize: 11, color: "#5390d944", marginTop: 4 }}>{formatDurationDesc(duration)}</p>
        <button
          onClick={openSettings}
          title="Timer settings"
          style={{
            position: "absolute", right: -32, top: -4, cursor: "pointer", padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.15)",
            borderRadius: 10, color: "#5390d9",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(0,180,216,0.18)";
            e.currentTarget.style.borderColor = "rgba(0,180,216,0.35)";
            e.currentTarget.style.color = "#00b4d8";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(0,180,216,0.08)";
            e.currentTarget.style.borderColor = "rgba(0,180,216,0.15)";
            e.currentTarget.style.color = "#5390d9";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
      {/* Video progress bar */}
      <div style={{ width: "100%" }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#5390d9", marginBottom: 8 }}>
          Video Progress
        </p>
        <div style={{ width: "100%", height: 4, background: "#002855", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: `${Math.round(videoProgress * 100)}%`,
            background: "linear-gradient(90deg, #0077b6, #00b4d8)",
            transition: "width 1s linear"
          }} />
        </div>
        <p style={{ fontSize: 11, color: "#5390d966", marginTop: 5, textAlign: "right" }}>
          {Math.round(videoProgress * 100)}%
        </p>
      </div>

      {/* Sessions done */}
      {completedSessions > 0 && (
        <div style={{ width: "100%", marginTop: 4 }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#5390d9", marginBottom: 6 }}>
            Sessions Done
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {completedSessionDurations.map((dur, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0, 180, 216, 0.06)",
                border: "1px solid rgba(0, 180, 216, 0.15)",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#00b4d8",
                boxShadow: "0 2px 8px rgba(0, 180, 216, 0.02)",
                backdropFilter: "blur(4px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>
                    Session {idx + 1}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#5390d9" }}>
                  {Math.round(dur / 60)} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,8,20,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          backdropFilter: "blur(12px)"
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            background: "linear-gradient(135deg, #000814 0%, #001529 100%)",
            border: "1px solid rgba(0, 180, 216, 0.3)",
            borderRadius: 20, padding: "32px",
            width: 320, boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 25px rgba(0,180,216,0.15)",
            display: "flex", flexDirection: "column", gap: 24
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8f4fd", letterSpacing: "0.03em", margin: 0 }}>
                Set Timer Duration
              </h3>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(0, 40, 85, 0.25)",
              padding: "20px 16px",
              borderRadius: 14,
              border: "1px solid rgba(0, 119, 182, 0.25)",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)"
            }}>
              {/* Hours input group */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="00"
                  value={inputHours}
                  onChange={e => {
                    const val = e.target.value.slice(0, 2);
                    setInputHours(val);
                  }}
                  onKeyDown={e => e.key === "Enter" && handleSaveDuration()}
                  style={{
                    width: 54, height: 48, fontSize: 22, fontWeight: 700, textAlign: "center",
                    borderRadius: 10, border: "1px solid rgba(0, 119, 182, 0.4)", background: "#000814", color: "#fff", fontFamily: "monospace",
                    outline: "none", transition: "all 0.25s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#00b4d8";
                    e.target.style.boxShadow = "0 0 12px rgba(0, 180, 216, 0.4)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(0, 119, 182, 0.4)";
                    e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
                  }}
                />
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "#5390d966", fontWeight: 700, letterSpacing: "0.05em" }}>hours</span>
              </div>

              <span style={{ fontSize: 20, color: "#00b4d8", fontWeight: 700, marginBottom: 18, fontFamily: "monospace" }}>:</span>

              {/* Minutes input group */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  value={inputMins}
                  onChange={e => {
                    const val = e.target.value.slice(0, 2);
                    setInputMins(val);
                  }}
                  onKeyDown={e => e.key === "Enter" && handleSaveDuration()}
                  style={{
                    width: 54, height: 48, fontSize: 22, fontWeight: 700, textAlign: "center",
                    borderRadius: 10, border: "1px solid rgba(0, 119, 182, 0.4)", background: "#000814", color: "#fff", fontFamily: "monospace",
                    outline: "none", transition: "all 0.25s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#00b4d8";
                    e.target.style.boxShadow = "0 0 12px rgba(0, 180, 216, 0.4)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(0, 119, 182, 0.4)";
                    e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
                  }}
                />
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "#5390d966", fontWeight: 700, letterSpacing: "0.05em" }}>mins</span>
              </div>

              <span style={{ fontSize: 20, color: "#00b4d8", fontWeight: 700, marginBottom: 18, fontFamily: "monospace" }}>:</span>

              {/* Seconds input group */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  value={inputSecs}
                  onChange={e => {
                    const val = e.target.value.slice(0, 2);
                    setInputSecs(val);
                  }}
                  onKeyDown={e => e.key === "Enter" && handleSaveDuration()}
                  style={{
                    width: 54, height: 48, fontSize: 22, fontWeight: 700, textAlign: "center",
                    borderRadius: 10, border: "1px solid rgba(0, 119, 182, 0.4)", background: "#000814", color: "#fff", fontFamily: "monospace",
                    outline: "none", transition: "all 0.25s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#00b4d8";
                    e.target.style.boxShadow = "0 0 12px rgba(0, 180, 216, 0.4)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(0, 119, 182, 0.4)";
                    e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
                  }}
                />
                <span style={{ fontSize: 10, textTransform: "uppercase", color: "#5390d966", fontWeight: 700, letterSpacing: "0.05em" }}>secs</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowSettings(false)}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(83, 144, 217, 0.3)",
                  background: "transparent", color: "#5390d9", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(83, 144, 217, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(83, 144, 217, 0.6)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(83, 144, 217, 0.3)";
                }}
              >
                Cancel
              </button>
              <button onClick={handleSaveDuration}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #0077b6, #00b4d8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,180,216,0.3)", transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,180,216,0.55)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,180,216,0.3)";
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}