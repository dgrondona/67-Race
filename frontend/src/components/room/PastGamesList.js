export default function PastGamesList({ pastGames }) {
  if (!pastGames.length) {
    return (
      <p className="room-meta">
        No completed races in this lobby yet. Results are cleared when the lobby closes or the last person leaves.
      </p>
    );
  }
  return (
    <div style={{ marginTop: "1rem" }}>
      {[...pastGames].reverse().map((game) => (
        <div key={game.race_index} className="past-game-block">
          <p className="room-meta" style={{ marginBottom: "0.5rem" }}>
            <strong>Race #{game.race_index}</strong>
            {" · "}
            winner:{" "}
            {(game.players || []).find((p) => String(p.user_id) === String(game.winner_id))?.username || "—"}
          </p>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Time (s)</th>
                <th>67s / sec</th>
              </tr>
            </thead>
            <tbody>
              {(game.players || []).map((row) => (
                <tr key={row.user_id}>
                  <td>{row.username}</td>
                  <td>{row.race_time_sec != null ? row.race_time_sec : "—"}</td>
                  <td>{row.sixty_sevens_per_sec != null ? row.sixty_sevens_per_sec : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
