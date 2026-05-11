export default function LobbyBar({
  username,
  isGuest,
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
    <section className="card">
      <p className="room-meta" style={{ marginTop: 0 }}>
        <strong style={{ color: "#f0f6fc" }}>{username}</strong>
        {isGuest ? " · guest" : ""}
      </p>
      <div className="field-row">
        <input
          className="input"
          placeholder="Room code (join a friend)"
          value={roomIdInput}
          onChange={(e) => onRoomIdChange(e.target.value.toUpperCase())}
        />
      </div>
      {peekHint ? <p className="peek-hint">{peekHint}</p> : null}
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={onHost}>Host lobby</button>
        <button type="button" className="btn btn-secondary" onClick={onJoin} disabled={joinDisabled}>Join lobby</button>
        <button type="button" className="btn btn-ghost" onClick={onLeave} disabled={leaveDisabled}>Leave</button>
        <button type="button" className="btn btn-ghost" onClick={onBackToHome}>Return to Login</button>
      </div>
    </section>
  );
}
