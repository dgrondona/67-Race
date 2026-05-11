export default function PrivateLobbyCard({
  roomIdInput,
  onRoomIdChange,
  peekHint,
  joinDisabled,
  onHost,
  onJoin,
  onLeave,
  onBackToHome,
  leaveDisabled
}) {
  return (
    <section className="card play-card">
      <h2 className="card-title">Private lobby</h2>
      <p className="room-meta" style={{ marginTop: 0 }}>
        Create a code for friends, or enter theirs. You need a host to start each race.
      </p>
      <div className="field-row">
        <input
          className="input"
          placeholder="Room code"
          value={roomIdInput}
          onChange={(e) => onRoomIdChange(e.target.value.toUpperCase())}
        />
      </div>
      {peekHint ? <p className="peek-hint">{peekHint}</p> : null}
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={onHost}>Create lobby</button>
        <button type="button" className="btn btn-secondary" onClick={onJoin} disabled={joinDisabled}>Join with code</button>
        <button type="button" className="btn btn-ghost" onClick={onLeave} disabled={leaveDisabled}>Leave lobby</button>
        <button type="button" className="btn btn-ghost" onClick={onBackToHome}>Log out</button>
      </div>
    </section>
  );
}
