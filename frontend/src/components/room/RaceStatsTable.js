export default function RaceStatsTable({ rows, userId, winnerUsername }) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>Last race stats</h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Time (s)</th>
            <th>67s / sec</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.user_id}>
              <td>
                {row.username}
                {String(row.user_id) === String(userId) ? " (you)" : ""}
              </td>
              <td>{row.race_time_sec != null ? row.race_time_sec : "—"}</td>
              <td>{row.sixty_sevens_per_sec != null ? row.sixty_sevens_per_sec : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="room-meta" style={{ marginTop: "0.75rem" }}>
        First across:{" "}
        <strong style={{ color: "#e6edf3" }}>{winnerUsername || "—"}</strong>
      </p>
    </div>
  );
}
