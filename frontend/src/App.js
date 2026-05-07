import { useState } from "react";
import HandTracker from "./components/camera/HandTracker";
import { socket } from "./socket";
import { useEffect } from "react";

function App() {
  const [wrist, setWrist] = useState(null);

  useEffect(() => {
  socket.emit("join_room", {
    room_id: "test",
    user_id: "player1"
  });
}, []);

  return (
    <div>
      <h1>67 Race</h1>

      <HandTracker onWristMove={setWrist} />

      {wrist && (
        <div>
          <p>X: {wrist.x.toFixed(2)}</p>
          <p>Y: {wrist.y.toFixed(2)}</p>
        </div>
      )}

      <button onClick={() => {
        socket.emit("gesture_detected", {
          room_id: "test",
          user_id: "player1"
        });

        console.log("GESTURE SENT")
      }}>
        TEST 67
      </button>

    </div>
  );
}

export default App;