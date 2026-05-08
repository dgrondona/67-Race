export default function LiveStandings({ players, targetScore, winnerId }) {
  return (
    <>
      <h3 className="card-title" style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Live standings</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.user_id}>
            <span>{player.username}</span>
            <span>
              {player.count}/{targetScore}
              {String(player.user_id) === String(winnerId) ? " · first to finish" : ""}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
