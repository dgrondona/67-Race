import { useEffect, useMemo, useState } from "react";
import { socket } from "./socket";
import { API_BASE } from "./config";
import { readJsonBody } from "./utils/http";
import { generateRoomCode } from "./utils/roomCode";
import { playCountdownTick, playGoSound, resumeAudioIfNeeded } from "./utils/sounds";
import AppHeader from "./components/layout/AppHeader";
import StatusBanner from "./components/common/StatusBanner";
import AuthPanel from "./components/auth/AuthPanel";
import Rules from "./components/rules/Rules"; // added for Rules page
import LobbyBar from "./components/lobby/LobbyBar";
import RoomPanel from "./components/room/RoomPanel";
import CountdownOverlay from "./components/room/CountdownOverlay";
import "./App.css";

function sortRaceResults(players) {
  return [...players].sort((a, b) => {
    const ta = a.race_time_sec;
    const tb = b.race_time_sec;
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return b.count - a.count;
  });
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
  const [showRules, setShowRules] = useState(false); // added for Rules page
  const [roomPeek, setRoomPeek] = useState(null);
  const [countdownPhase, setCountdownPhase] = useState(null);
  const targetScore = roomState?.target_score || 100;
  const maxPlayers = roomState?.max_players ?? 5;
  const pastGames = roomState?.past_games || [];
  const raceStatus = roomState?.status || "waiting";
  const players = roomState?.players || [];
  const myPlayer = players.find((player) => String(player.user_id) === String(user?.id));
  const myCount = myPlayer?.count || 0;
  const myReady = Boolean(myPlayer?.ready);
  const isHost = roomState && String(roomState.host_id) === String(user?.id);
  const allReady = players.length > 0 && players.every((p) => Boolean(p.ready));
  const joinDisabled =
    !roomIdInput.trim() ||
    (roomPeek && roomPeek.exists === true && roomPeek.can_join === false);
  const showStartRace = isHost;
  const startRaceDisabled =
    !isHost ||
    !allReady ||
    raceStatus === "racing" ||
    raceStatus === "countdown";
  const raceResultsRows = useMemo(
    () => sortRaceResults(roomState?.players || []),
    [roomState]
  );
  const winnerUsername = players.find((p) => String(p.user_id) === String(roomState?.winner_id))?.username;
  const peekHint = (() => {
    if (!roomIdInput.trim() || !roomPeek || !roomPeek.exists || roomPeek.can_join) return null;
    if (roomPeek.status === "countdown") return "countdown in progress — join is locked until it finishes.";
    if (roomPeek.status === "racing") return "race in progress — join is closed until this race ends.";
    return null;
  })();

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
          setCountdownPhase(null);
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

  useEffect(() => {
    const rid = activeRoomId ? activeRoomId.toUpperCase() : "";
    const onTick = (p) => {
      if (!rid || String(p.room_id || "").toUpperCase() !== rid) return;
      resumeAudioIfNeeded();
      playCountdownTick();
      setCountdownPhase(p.value);
    };
    const onGo = (p) => {
      if (!rid || String(p.room_id || "").toUpperCase() !== rid) return;
      resumeAudioIfNeeded();
      playGoSound();
      setCountdownPhase("go");
      setTimeout(() => setCountdownPhase(null), 650);
    };
    socket.on("countdown_tick", onTick);
    socket.on("countdown_go", onGo);
    return () => {
      socket.off("countdown_tick", onTick);
      socket.off("countdown_go", onGo);
    };
  }, [activeRoomId]);

  useEffect(() => {
    setCountdownPhase(null);
  }, [activeRoomId]);

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
    resumeAudioIfNeeded();
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
    setCountdownPhase(null);
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

  const setReady = (ready) => {
    if (!activeRoomId || !user) return;
    socket.emit("set_ready", {
      room_id: activeRoomId,
      user_id: user.id,
      ready
    });
  };

  return (
    <div className="app-root">
      <AppHeader />
      <main className="app-main">
        <StatusBanner statusMessage={statusMessage} error={error} />
        {!token && (
          <AuthPanel
            authMode={authMode}
            username={username}
            password={password}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onAuthModeToggle={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            onSubmit={handleAuth}
            onGuest={handleGuest}
            onShowRules={() => setShowRules(true)}
          />
        )}
        {token && user && (
          <LobbyBar
            username={user.username}
            isGuest={isGuest}
            roomIdInput={roomIdInput}
            onRoomIdChange={setRoomIdInput}
            peekHint={peekHint}
            joinDisabled={joinDisabled}
            onHost={hostLobby}
            onJoin={joinLobby}
            onLeave={leaveLobby}
            leaveDisabled={!activeRoomId}
          />
        )}
        {activeRoomId && user && (
          <RoomPanel
            activeRoomId={activeRoomId}
            user={user}
            raceStatus={raceStatus}
            targetScore={targetScore}
            maxPlayers={maxPlayers}
            myCount={myCount}
            isHost={isHost}
            roomTab={roomTab}
            onTabChange={setRoomTab}
            onStartRace={startRace}
            onCloseLobby={closeLobby}
            startRaceDisabled={startRaceDisabled}
            showStartRace={showStartRace}
            players={players}
            myReady={myReady}
            onToggleReady={setReady}
            allReady={allReady}
            raceResultsRows={raceResultsRows}
            winnerUsername={winnerUsername}
            pastGames={pastGames}
            winnerId={roomState?.winner_id}
          />
        )}
      </main>
      <CountdownOverlay phase={countdownPhase} />
      {showRules && <Rules onClose={() => setShowRules(false)}/>}
    </div>
  );
}

export default App;
