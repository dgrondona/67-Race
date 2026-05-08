import HandTracker from "../camera/HandTracker";
import ReadyBar from "./ReadyBar";
import RaceStatsTable from "./RaceStatsTable";
import LiveStandings from "./LiveStandings";
import PastGamesList from "./PastGamesList";

export default function RoomPanel({
  activeRoomId,
  user,
  raceStatus,
  targetScore,
  maxPlayers,
  myCount,
  isHost,
  roomTab,
  onTabChange,
  onStartRace,
  onCloseLobby,
  startRaceDisabled,
  showStartRace,
  players,
  myReady,
  onToggleReady,
  allReady,
  raceResultsRows,
  winnerUsername,
  pastGames,
  winnerId
}) {
  return (
    <section className="card">
      <h2 className="card-title">Room {activeRoomId}</h2>
      <p className="room-meta">Status: <strong style={{ color: "#e6edf3" }}>{raceStatus}</strong></p>
      <p className="room-meta">Lobby: {players.length} / {maxPlayers}</p>
      <p className="room-meta">Goal: {targetScore} 67s each. The run finishes when everyone hits the goal.</p>
      <p className="score-highlight">Your score: {myCount} / {targetScore}</p>
      <div className="btn-row">
        {showStartRace ? (
          <button type="button" className="btn btn-primary" onClick={onStartRace} disabled={startRaceDisabled}>
            Start race
          </button>
        ) : null}
        {isHost ? (
          <button type="button" className="btn btn-secondary" onClick={onCloseLobby}>Close lobby</button>
        ) : null}
      </div>
      {(raceStatus === "waiting" || raceStatus === "finished") && (
        <ReadyBar
          players={players}
          userId={user?.id}
          roomStatus={raceStatus}
          myReady={myReady}
          onToggleReady={onToggleReady}
          allReady={allReady}
          isHost={isHost}
        />
      )}
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={roomTab === "current"} className={`tab ${roomTab === "current" ? "tab-active" : ""}`} onClick={() => onTabChange("current")}>Current race</button>
        <button type="button" role="tab" aria-selected={roomTab === "past"} className={`tab ${roomTab === "past" ? "tab-active" : ""}`} onClick={() => onTabChange("past")}>Past games</button>
      </div>
      {roomTab === "current" && (
        <>
          {raceStatus === "finished" && raceResultsRows?.length > 0 && (
            <RaceStatsTable
              rows={raceResultsRows}
              userId={user?.id}
              winnerUsername={winnerUsername}
            />
          )}
          <div className="camera-wrap">
            <HandTracker
              userId={String(user?.id || "")}
              roomId={activeRoomId}
              raceStatus={raceStatus}
            />
          </div>
          <LiveStandings
            players={players}
            targetScore={targetScore}
            winnerId={winnerId}
          />
        </>
      )}
      {roomTab === "past" && <PastGamesList pastGames={pastGames} />}
    </section>
  );
}
