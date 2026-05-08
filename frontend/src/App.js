import { useEffect, useState } from "react";
import { socket } from "./socket";
import { API_BASE } from "./config";
import HandTracker from "./components/camera/HandTracker";
import "./App.css";

async function readJsonBody(response) {
  const text = await response.text();
  if (!text || !String(text).trim()) {
    return { json: null, parseError: false, empty: true, text: "" };
  }
  try {
    return { json: JSON.parse(text), parseError: false, empty: false, text };
  } catch (e) {
    return { json: null, parseError: true, empty: false, text };
  }
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function App() {
  const [token, setToken] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [roomTab, setRoomTab] = useState("current");
  const [roomPeek, setRoomPeek] = useState(null);
  const targetScore = roomState?.target_score || 100;
  const maxPlayers = roomState?.max_players ?? 5;
  const pastGames = roomState?.past_games || [];
  const raceStatus = roomState?.status || "waiting";

  useEffect(() => {
    socket.on("room_state", (data) => {
      setRoomState(data);
    });
    socket.on("race_started", (data) => {
      setRoomState(data);
      setStatusMessage("race started");
    });
    socket.on("race_finished", (data) => {
      setRoomState(data);
      setStatusMessage("race finished");
      setRoomTab("current");
    });
    socket.on("room_error", (data) => {
      setError(data.message || "socket error");
    });
    return () => {
      socket.off("room_state");
      socket.off("race_started");
      socket.off("race_finished");
      socket.off("room_error");
    };
  }, []);

  useEffect(() => {
    const onClosed = (p) => {
      const id = (p.room_id || "").toUpperCase();
      setActiveRoomId((cur) => {
        if (cur && cur.toUpperCase() === id) {
          setRoomState(null);
          setRoomTab("current");
          setStatusMessage("lobby closed by host");
          return "";
        }
        return cur;
      });
    };
    socket.on("lobby_closed", onClosed);
    return () => socket.off("lobby_closed", onClosed);
  }, []);

  useEffect(() => {
    if (!token) return;
    const code = roomIdInput.trim().toUpperCase();
    if (!code) {
      setRoomPeek(null);
      return;
    }
    const t = setTimeout(() => {
      socket.emit("peek_room", { room_id: code });
    }, 320);
    return () => clearTimeout(t);
  }, [roomIdInput, token]);

  useEffect(() => {
    const onPeek = (p) => {
      const want = roomIdInput.trim().toUpperCase();
      if (!p.room_id || String(p.room_id).toUpperCase() !== want) return;
      setRoomPeek(p);
    };
    socket.on("room_peek", onPeek);
    return () => socket.off("room_peek", onPeek);
  }, [roomIdInput]);

  const handleAuth = async () => {
    setError("");
    const endpoint = authMode === "login" ? "login" : "signup";
    const payload = { username, password };
    let response;
    try {
      response = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setError(
        "cannot reach auth api — use `npm start` for the frontend and run the flask server on port 5000"
      );
      return;
    }
    const parsed = await readJsonBody(response);
    if (parsed.empty) {
      setError(
        `empty response from server (${response.status}). is the flask app running on port 5000?`
      );
      return;
    }
    if (parsed.parseError) {
      setError(
        `server returned non-json (${response.status}). restart the flask server after pulling changes; if it persists, remove backend/app.db and restart. first bytes: ${String(parsed.text).slice(0, 160)}`
      );
      return;
    }
    const data = parsed.json;
    if (!response.ok) {
      setError(data?.error || "auth failed");
      return;
    }
    setToken(data.token);
    setUser(data.user);
    setIsGuest(false);
    setStatusMessage(authMode === "login" ? "logged in" : "signed up");
  };
  const handleGuest = async () => {
    setError("");
    let response;
    try {
      response = await fetch(`${API_BASE}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      setError(
        "cannot reach auth api — use `npm start` for the frontend and run the flask server on port 5000"
      );
      return;
    }
    const parsed = await readJsonBody(response);
    if (parsed.empty) {
      setError(
        `empty response from server (${response.status}). is the flask app running on port 5000?`
      );
      return;
    }
    if (parsed.parseError) {
      setError(
        `server returned non-json (${response.status}). first bytes: ${String(parsed.text).slice(0, 160)}`
      );
      return;
    }
    const data = parsed.json;
    if (!response.ok) {
      setError(data?.error || "guest failed");
      return;
    }
    setToken(data.token);
    setUser(data.user);
    setIsGuest(true);
    setStatusMessage("playing as guest");
  };

  const hostLobby = () => {
    if (!user) return;
    const code = generateRoomCode();
    setRoomIdInput(code);
    setActiveRoomId(code);
    setError("");
    socket.emit("host_lobby", {
      room_id: code,
      user_id: user.id,
      username: user.username || `user_${user.id}`
    });
  };

  const joinLobby = () => {
    if (!user || !roomIdInput.trim()) return;
    setActiveRoomId(roomIdInput.trim().toUpperCase());
    setError("");
    socket.emit("join_lobby", {
      room_id: roomIdInput.trim().toUpperCase(),
      user_id: user.id,
      username: user.username || `user_${user.id}`
    });
  };

  const startRace = () => {
    if (!activeRoomId || !user) return;
    setError("");
    socket.emit("start_race", {
      room_id: activeRoomId,
      user_id: user.id
    });
  };

  const leaveLobby = () => {
    if (!activeRoomId || !user) return;
    socket.emit("leave_lobby", {
      room_id: activeRoomId,
      user_id: user.id
    });
    setActiveRoomId("");
    setRoomState(null);
    setStatusMessage("left lobby");
  };

  const closeLobby = () => {
    if (!activeRoomId || !user) return;
    setError("");
    socket.emit("close_lobby", {
      room_id: activeRoomId,
      user_id: user.id
    });
  };

  const players = roomState?.players || [];
  const myPlayer = players.find((player) => String(player.user_id) === String(user?.id));
  const myCount = myPlayer?.count || 0;
  const isHost = roomState && String(roomState.host_id) === String(user?.id);
  const joinDisabled =
    !roomIdInput.trim() ||
    (roomPeek && roomPeek.exists === true && roomPeek.can_join === false);
  const showStartRace = isHost;
  const startRaceDisabled = !isHost || raceStatus === "racing";
  const peekHint = roomIdInput.trim() && roomPeek && roomPeek.exists && !roomPeek.can_join
    ? "race in progress — join is closed until this race ends."
    : null;

  const resultsPlayers = [...players].sort((a, b) => {
    const ta = a.race_time_sec;
    const tb = b.race_time_sec;
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return b.count - a.count;
  });

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">67 Race</h1>
        <p className="app-sub">
          Who can 67 the fastest?
        </p>
      </header>

      <main className="app-main">
        {statusMessage ? <p className="status-line">{statusMessage}</p> : null}
        {error ? <div className="error-banner" role="alert">{error}</div> : null}

        {!token && (
          <section className="card">
            <h2 className="card-title">{authMode === "login" ? "Log in" : "Create account"}</h2>
            <div className="field-row">
              <input
                className="input"
                placeholder="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="field-row">
              <input
                className="input"
                type="password"
                placeholder="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={handleAuth}>
                {authMode === "login" ? "Log in" : "Sign up"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                {authMode === "login" ? "Need an account?" : "Have an account?"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleGuest}>Play as guest</button>
            </div>
          </section>
        )}

        {token && user && (
          <section className="card">
            <p className="room-meta" style={{ marginTop: 0 }}>
              <strong style={{ color: "#f0f6fc" }}>{user.username}</strong>
              {isGuest ? " · guest" : ""}
            </p>
            <div className="field-row">
              <input
                className="input"
                placeholder="Room code (join a friend)"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              />
            </div>
            {peekHint ? <p className="peek-hint">{peekHint}</p> : null}
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={hostLobby}>Host lobby</button>
              <button type="button" className="btn btn-secondary" onClick={joinLobby} disabled={joinDisabled}>Join lobby</button>
              <button type="button" className="btn btn-ghost" onClick={leaveLobby}>Leave</button>
            </div>
          </section>
        )}

        {activeRoomId && (
          <section className="card">
            <h2 className="card-title">Room {activeRoomId}</h2>
            <p className="room-meta">Status: <strong style={{ color: "#e6edf3" }}>{raceStatus}</strong></p>
            <p className="room-meta">Lobby: {players.length} / {maxPlayers}</p>
            <p className="room-meta">Goal: {targetScore} 67s each. The run finishes when everyone hits the goal.</p>
            <p className="score-highlight">Your score: {myCount} / {targetScore}</p>
            <div className="btn-row">
              {showStartRace ? (
                <button type="button" className="btn btn-primary" onClick={startRace} disabled={startRaceDisabled}>
                  Start race
                </button>
              ) : null}
              {isHost ? (
                <button type="button" className="btn btn-secondary" onClick={closeLobby}>Close lobby</button>
              ) : null}
            </div>

            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={roomTab === "current"} className={`tab ${roomTab === "current" ? "tab-active" : ""}`} onClick={() => setRoomTab("current")}>Current race</button>
              <button type="button" role="tab" aria-selected={roomTab === "past"} className={`tab ${roomTab === "past" ? "tab-active" : ""}`} onClick={() => setRoomTab("past")}>Past games</button>
            </div>

            {roomTab === "current" && (
              <>
                {raceStatus === "finished" && (
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
                        {resultsPlayers.map((row) => (
                          <tr key={row.user_id}>
                            <td>
                              {row.username}
                              {String(row.user_id) === String(user?.id) ? " (you)" : ""}
                            </td>
                            <td>{row.race_time_sec != null ? row.race_time_sec : "—"}</td>
                            <td>{row.sixty_sevens_per_sec != null ? row.sixty_sevens_per_sec : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="room-meta" style={{ marginTop: "0.75rem" }}>
                      First across:{" "}
                      <strong style={{ color: "#e6edf3" }}>
                        {players.find((p) => String(p.user_id) === String(roomState?.winner_id))?.username || "—"}
                      </strong>
                    </p>
                  </div>
                )}
                <div className="camera-wrap">
                  <HandTracker
                    userId={String(user?.id || "")}
                    roomId={activeRoomId}
                    raceStatus={raceStatus}
                  />
                </div>
                <h3 className="card-title" style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Live standings</h3>
                <ul className="player-list">
                  {players.map((player) => (
                    <li key={player.user_id}>
                      <span>{player.username}</span>
                      <span>
                        {player.count}/{targetScore}
                        {String(player.user_id) === String(roomState?.winner_id) ? " · first to finish" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {roomTab === "past" && (
              <div style={{ marginTop: "1rem" }}>
                {pastGames.length === 0 ? (
                  <p className="room-meta">No completed races in this lobby yet. Results are cleared when the lobby closes or the last person leaves.</p>
                ) : (
                  [...pastGames].reverse().map((game) => (
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
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
