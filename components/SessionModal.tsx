interface SessionModalProps {
  sessionNumber: number;
  onBreak: () => void;
  onContinue: () => void;
}

export default function SessionModal({ sessionNumber, onBreak, onContinue }: SessionModalProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,8,20,0.92)"
    }}>
      <div style={{
        width: 320, borderRadius: 16, padding: "32px 24px", textAlign: "center",
        background: "#000d1a", border: "1px solid #0077b6"
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#002855", border: "1px solid #0077b6"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polyline points="4,12 9,18 20,6" stroke="#00b4d8"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Session {sessionNumber} Complete!
        </h2>
        <p style={{ fontSize: 13, color: "#4ea8de", marginBottom: 4 }}>
          25 minutes of focused study done.
        </p>
        <p style={{ fontSize: 12, color: "#5390d966", marginBottom: 28 }}>
          Progress saved. Take a breather or keep going?
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onBreak} style={{
            flex: 1, padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: "transparent", border: "1px solid #0077b6", color: "#4ea8de", cursor: "pointer"
          }}>
            Take a Break
          </button>
          <button onClick={onContinue} style={{
            flex: 1, padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: "#0077b6", border: "none", color: "#fff", cursor: "pointer"
          }}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}