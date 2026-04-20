import { useState } from "react";
import HandTracker from "./components/HandTracker";

function App() {
  const [wrist, setWrist] = useState(null);

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
    </div>
  );
}

export default App;