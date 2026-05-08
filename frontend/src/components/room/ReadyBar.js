export default function ReadyBar({
  players,
  userId,
  roomStatus,
  myReady,
  onToggleReady,
  allReady,
  isHost
}) {
  const canToggle = roomStatus === "waiting" || roomStatus === "finished";
  const waitingLine =
    isHost && canToggle && !allReady && players.length > 0
      ? "Waiting for everyone to tap Ready before you can start."
      : null;
  return (
    <div className="ready-bar">
      {waitingLine ? <p className="peek-hint" style={{ marginBottom: "0.75rem" }}>{waitingLine}</p> : null}
      <div className="ready-row">
        {canToggle ? (
          <button
            type="button"
            className={`btn ${myReady ? "btn-secondary" : "btn-primary"}`}
            onClick={() => onToggleReady(!myReady)}
          >
            {myReady ? "Not ready" : "Ready"}
          </button>
        ) : null}
      </div>
      <ul className="ready-list">
        {players.map((p) => (
          <li key={p.user_id}>
            <span>{p.username}</span>
            <span className={p.ready ? "ready-yes" : "ready-no"}>
              {p.ready ? "ready" : "not ready"}
              {String(p.user_id) === String(userId) ? " (you)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
