export default function MatchmakingCard({
  inQueue,
  queueLength,
  queuePosition,
  onJoinQueue,
  onLeaveQueue
}) {
  return (
    <section className="card play-card">
      <h2 className="card-title">Matchmaking</h2>
      <p className="room-meta" style={{ marginTop: 0 }}>
        Join the pool. When 5 players are ready, you are placed in an auto lobby (no host). After each race, choose to stay or leave — players who do not answer in 10 seconds are removed and the queue fills empty seats.
      </p>
      {inQueue ? (
        <div className="mm-status">
          <p className="score-highlight" style={{ marginBottom: "0.5rem" }}>Searching for match…</p>
          <p className="room-meta">
            Queue position: <strong style={{ color: "#e6edf3" }}>{queuePosition ?? "—"}</strong>
            {" · "}
            Players waiting: <strong style={{ color: "#e6edf3" }}>{queueLength}</strong>
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-secondary" onClick={onLeaveQueue}>Leave queue</button>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={onJoinQueue}>Find match (5 players)</button>
        </div>
      )}
    </section>
  );
}
