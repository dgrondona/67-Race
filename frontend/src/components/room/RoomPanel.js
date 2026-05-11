import HandTracker from "../camera/HandTracker";
import ReadyBar from "./ReadyBar";
import RaceStatsTable from "./RaceStatsTable";
import LiveStandings from "./LiveStandings";
import PastGamesList from "./PastGamesList";
import RematchPanel from "./RematchPanel";

function sortByRaceTime(rows) {
  return [...(rows || [])].sort((a, b) => {
    const ta = a.race_time_sec;
    const tb = b.race_time_sec;
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return (b.count || 0) - (a.count || 0);
  });
}

export default function RoomPanel({
  activeRoomId,
  user,
  raceStatus,
  targetScore,
  maxPlayers,
  myCount,
  isHost,
  isMatchmaking,
  roomTab,
  onTabChange,
  onStartRace,
  onCloseLobby,
  startRaceDisabled,
  showStartRace,
  showCloseLobby,
  players,
  myReady,
  onToggleReady,
  allReady,
  statsRows,
  statsWinnerName,
  showStatsBlock,
  pastGames,
  winnerId,
  rematchSecondsLeft,
  onRematchContinue,
  onRematchLeave
}) {
  const myChoice = players.find((p) => String(p.user_id) === String(user?.id))?.rematch_choice;
  return (
    <section className="card room-panel-card">
      <div className="room-panel-head">
        <div>
          <h2 className="card-title" style={{ marginBottom: "0.25rem" }}>
            {isMatchmaking ? "Match lobby" : "Private room"} · {activeRoomId}
          </h2>
          <p className="room-meta" style={{ marginTop: 0 }}>
            {isMatchmaking ? "Auto-filled · any player can start when all ready" : "Host starts the race when everyone is ready"}
          </p>
        </div>
        <span className={`room-badge room-badge-${raceStatus}`}>{raceStatus}</span>
      </div>
      <p className="room-meta">Players: {players.length} / {maxPlayers}</p>
      <p className="room-meta">First to {targetScore} 67 gestures wins the sprint; the run ends when everyone finishes.</p>
      <p className="score-highlight">Your score: {myCount} / {targetScore}</p>
      <div className="btn-row">
        {showStartRace ? (
          <button type="button" className="btn btn-primary" onClick={onStartRace} disabled={startRaceDisabled}>
            Start race
          </button>
        ) : null}
        {showCloseLobby ? (
          <button type="button" className="btn btn-secondary" onClick={onCloseLobby}>Close lobby</button>
        ) : null}
      </div>
      {raceStatus === "rematch" && (
        <RematchPanel
          secondsLeft={rematchSecondsLeft}
          myChoice={myChoice}
          players={players}
          userId={user?.id}
          onContinue={onRematchContinue}
          onLeave={onRematchLeave}
        />
      )}
      {(raceStatus === "waiting" || raceStatus === "finished") && (
        <ReadyBar
          players={players}
          userId={user?.id}
          roomStatus={raceStatus}
          myReady={myReady}
          onToggleReady={onToggleReady}
          allReady={allReady}
          isHost={isHost || isMatchmaking}
        />
      )}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={roomTab === "current"} className={`tab ${roomTab === "current" ? "tab-active" : ""}`} onClick={() => onTabChange("current")}>Current race</button>
        <button type="button" role="tab" aria-selected={roomTab === "past"} className={`tab ${roomTab === "past" ? "tab-active" : ""}`} onClick={() => onTabChange("past")}>Past games</button>
      </div>
      {roomTab === "current" && (
        <>
          {showStatsBlock && statsRows?.length > 0 && (
            <RaceStatsTable
              rows={sortByRaceTime(statsRows)}
              userId={user?.id}
              winnerUsername={statsWinnerName}
            />
          )}
          {raceStatus !== "rematch" && (
            <div className="camera-wrap">
              <HandTracker
                userId={String(user?.id || "")}
                roomId={activeRoomId}
                raceStatus={raceStatus}
              />
            </div>
          )}
          {raceStatus !== "rematch" && (
            <LiveStandings
              players={players}
              targetScore={targetScore}
              winnerId={winnerId}
            />
          )}
        </>
      )}
      {roomTab === "past" && <PastGamesList pastGames={pastGames} />}
    </section>
  );
}
