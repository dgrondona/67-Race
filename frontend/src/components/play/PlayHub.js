import ModeTabs from "./ModeTabs";
import PrivateLobbyCard from "./PrivateLobbyCard";
import MatchmakingCard from "./MatchmakingCard";

export default function PlayHub({
  username,
  isGuest,
  playMode,
  onPlayModeChange,
  roomIdInput,
  onRoomIdChange,
  peekHint,
  joinDisabled,
  onHost,
  onJoin,
  onLeave,
  onBackToHome,
  leaveDisabled,
  inQueue,
  queueLength,
  queuePosition,
  onJoinQueue,
  onLeaveQueue
}) {
  return (
    <div className="play-hub">
      <section className="card play-identity">
        <p className="room-meta" style={{ marginTop: 0 }}>
          Signed in as <strong style={{ color: "#f0f6fc" }}>{username}</strong>
          {isGuest ? " · guest" : ""}
        </p>
      </section>
      <ModeTabs value={playMode} onChange={onPlayModeChange} />
      {playMode === "private" && (
        <PrivateLobbyCard
          roomIdInput={roomIdInput}
          onRoomIdChange={onRoomIdChange}
          peekHint={peekHint}
          joinDisabled={joinDisabled}
          onHost={onHost}
          onJoin={onJoin}
          onLeave={onLeave}
          onBackToHome={onBackToHome}
          leaveDisabled={leaveDisabled}
        />
      )}
      {playMode === "matchmaking" && (
        <MatchmakingCard
          inQueue={inQueue}
          queueLength={queueLength}
          queuePosition={queuePosition}
          onJoinQueue={onJoinQueue}
          onLeaveQueue={onLeaveQueue}
        />
      )}
    </div>
  );
}
