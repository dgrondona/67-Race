export default function Rules({ onClose }) {
    return (
      <div className="rules-overlay">
        <div className="rules-card">
          <h2>🏁 67-RACE - OFFICIAL RULES</h2>
          
          <div className="rules-section">
            <h3>❓ WHAT IS THIS GAME?</h3>
            <p>A fast-paced multiplayer challenge where players compete to perform the "67 motion" as many times as possible. <strong>First to 100 reps wins.</strong></p>
          </div>
          
          <div className="rules-section">
            <h3>🎮 HOW TO PLAY</h3>
            <ol>
              <li><strong>CREATE ACCOUNT / JOIN</strong> - Players must create an account or log in to participate. Optional: join as a guest (limited access).</li>
              <li><strong>LOBBY SYSTEM</strong> - Players can host a lobby or join an existing one. If you are the first friend online, you must host. The host receives a lobby code. Share the code with friends to join the same lobby.</li>
              <li><strong>START THE RACE</strong> - Once all players have joined, the host starts the race. No new players can join after the race starts.</li>
              <li><strong>READY CHECK</strong> - All players must click "Ready". The race begins only when everyone is ready.</li>
              <li><strong>THE 67 CHALLENGE</strong> - Players perform the "67 motion" repeatedly. Each valid motion counts as 1 point. First player to reach 100 reps wins. Speed and consistency matter.</li>
            </ol>
          </div>
          
          <div className="rules-section">
            <h3>🏆 WIN CONDITION</h3>
            <p>First player to reach <strong>100 successful 67 motions</strong> wins. If multiple players reach 100 at the same time, fastest completion time wins.</p>
          </div>
          
          <div className="rules-section">
            <h3>😄 FUN RULE</h3>
            <p><em>"You can 67 the most before it's even a game"</em></p>
            <ul>
              <li>Warm-ups are allowed</li>
              <li>Friendly Banter is encouraged</li>
              <li>Chaos is expected</li>
            </ul>
          </div>
          
          <div className="rules-section">
            <h3>⚠️ OPTIONAL CHAOS RULES</h3>
            <ul>
              <li>No fake or spammed reps</li>
              <li>All motions must be clearly performed</li>
              <li>Host has final decision in disputes</li>
              <li>Respect the 67 code</li>
            </ul>
          </div>
          
          <button className="btn btn-primary" onClick={onClose}>
            Got it! Let's Race 🏎️
          </button>
        </div>
      </div>
    );
  }