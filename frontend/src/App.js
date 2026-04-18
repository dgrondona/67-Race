import { useEffect } from "react";
import { socket } from "./socket";

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });
  }, []);

  const sendMove = () => {
    socket.emit("move");
  };

  return (
    <div>
      <h1>67 Race</h1>
      <button onClick={sendMove}>Move</button>
    </div>
  );
}

export default App;