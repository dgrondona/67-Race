import { useEffect, useState } from "react";
import { socket } from "./socket";
import HandTracker from "./components/camera/HandTracker";

function App() {
  const [state, setState] = useState({});

  const roomId = "test";
  const [userId] = useState(
    () => Math.random().toString(36).substring(7)
  );

  useEffect(() => {
    console.log("JOINING ROOM");

    socket.emit("join_room", {
      room_id: roomId,
      user_id: userId
    });

    socket.on("state_update", (data) => {
      console.log("STATE UPDATE:", data);
      setState(data);
    });

    return () => {
      socket.off("state_update");
    };
  }, []);

  const sendGesture = () => {
    console.log("GESTURE SENT");

    socket.emit("gesture_detected", {
      room_id: roomId,
      user_id: userId
    });
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>67 Race</h1>

      <button onClick={sendGesture}>
        TEST 67
      </button>

      <HandTracker userId={userId} />

      <h2>Players</h2>

      {Object.entries(state).map(([player, count]) => (
        <div key={player}>
          {player}: {count}
        </div>
      ))}
    </div>
  );
}

export default App;