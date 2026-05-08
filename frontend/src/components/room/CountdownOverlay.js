export default function CountdownOverlay({ phase }) {
  if (phase == null) return null;
  const label = phase === "go" ? "GO!" : phase;
  return (
    <div className="countdown-overlay" aria-live="assertive">
      <div className={`countdown-digit ${phase === "go" ? "countdown-go" : ""}`}>
        {label}
      </div>
    </div>
  );
}
