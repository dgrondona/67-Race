export default function Rules({ onClose }) {
    return (
      <div className="rules-overlay">
        <div className="rules-card">
          <h2>ABOUT</h2>
          
          <div className="rules-section">
            <h3>❓ WHAT IS THIS GAME?</h3>
            <p>67 Race is a fast-paced multiplayer game where players compete to perform <strong>100</strong> "67 motions" as fast as possible.</p>
          </div>
          
          <div className="rules-section">
            <h3>🎮 HOW TO PLAY</h3>
            <ol>
              <li><strong>CREATE ACCOUNT / JOIN</strong> - Players can create an account or log in to participate. Players may also join as a guest if they do not want an account.</li>
              <li><strong>LOBBY SYSTEM</strong> - Players can host a lobby, join an existing one, or join the matchmaking queue. When hosting a game, the host will have a lobby that they can share for others to join.</li>
              <li><strong>START THE RACE</strong> - Once all players have joined, players can click the "Ready" button, and the host starts the race. New players cannot join the lobby when a race is active.</li>
              <li><strong>THE 67 CHALLENGE</strong> - Players perform the "67 motion" repeatedly. Each valid motion counts as 1 point. First player to reach 100 reps wins. Speed and consistency matter.</li>
            </ol>
          </div>
          
          <div className="rules-section">
            <h3>🏆 WIN CONDITION</h3>
            <p>First player to reach <strong>100 successful 67 motions</strong> wins. If multiple players reach 100 at the same time, fastest completion time wins.</p>
          </div>

          <div className="rules-section">
            <h3>HOW IT WORKS</h3>
            <p>67 Race uses Google MediaPipe pose tracking to track the wrists. When it detects a "67 motion", you get a point.</p>
            <p>Your browser communicates with the backend server (hosted on Render) using SocketIO for quick communication times. Your browser also updates with lobby information such as the point totals of the other players in the lobby.</p>
          </div>

          <div className="rules-section">
            <h3>PRIVACY</h3>
            <p>Google MediaPipe uses Artificial Intelegence to track your hand movments, but this is all done on the browser. Your camera feed is not sent anywhere, only your points are sent to our backend server.</p>
            <p>Passwords are hashed and salted to keep your password safe. Honestly, I wouldn't trust it though. <strong>DO NOT</strong> reuse passwords on this site or they may be compromised.</p>
          </div>
          
          <button className="btn btn-primary" onClick={onClose}>
            Got it! Let's Race 🏎️
          </button>
        </div>
      </div>
    );
  }