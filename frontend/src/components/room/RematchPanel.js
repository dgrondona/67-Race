export default function RematchPanel({
  secondsLeft,
  myChoice,
  players,
  userId,
  onContinue,
  onLeave
}) {
  const voted = myChoice !== null && myChoice !== undefined;
  return (
    <div className="rematch-panel">
      <h3 className="card-title">Play again?</h3>
      <p className="room-meta">
        {secondsLeft != null ? (
          <>Time left to answer: <strong style={{ color: "#ffa657" }}>{secondsLeft}s</strong></>
        ) : (
          "Waiting…"
        )}
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={onContinue} disabled={voted}>Continue</button>
        <button type="button" className="btn btn-secondary" onClick={onLeave} disabled={voted}>Leave lobby</button>
      </div>
      <ul className="ready-list" style={{ marginTop: "0.75rem" }}>
        {players.map((p) => (
          <li key={p.user_id}>
            <span>{p.username}</span>
            <span className={p.rematch_choice === null || p.rematch_choice === undefined ? "ready-no" : "ready-yes"}>
              {p.rematch_choice === null || p.rematch_choice === undefined ? "waiting" : p.rematch_choice === "continue" ? "continue" : "leaving"}
              {String(p.user_id) === String(userId) ? " (you)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
