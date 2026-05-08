import { useRef, useState } from "react";
import { socket } from "../socket"

export default function use67Counter(userId, roomId, raceStatus) {
  const [count, setCount] = useState(0);

  const state = useRef({
    left: createHandState(),
    right: createHandState()
  });
  const roomRef = useRef(roomId);
  const raceRef = useRef(raceStatus);
  const userRef = useRef(userId);
  roomRef.current = roomId;
  raceRef.current = raceStatus;
  userRef.current = userId;

  // ─────────────────────────────
  // CONFIG (MUST BE ABOVE FUNCTION)
  // ─────────────────────────────
  const SMOOTHING = 0.25;
  const WINDOW = 6;

  const MIN_MOVEMENT = 0.015;
  const PROMINENCE = 0.02;
  const COOLDOWN_MS = 200;

  return {
    count,
    updateWrist
  };

  // ─────────────────────────────
  function createHandState() {
    return {
      smoothY: null,
      history: [],
      lastEvent: null,
      lastEventTime: 0,
      stage: 0,
      minY: null,
      maxY: null
    };
  }

  function updateWrist(side, rawY, inverted = false) {
  const s = state.current[side];
  const now = performance.now();

  // ───────── smoothing (light, responsive) ─────────
  const alpha = 0.35;

  if (s.smoothY === null) {
    s.smoothY = rawY;
  } else {
    s.smoothY = alpha * rawY + (1 - alpha) * s.smoothY;
  }

  // ───────── initialize history ─────────
  s.history.push(s.smoothY);
  if (s.history.length > 5) s.history.shift();

  if (s.history.length < 3) return;

  const prev = s.history[s.history.length - 2];
  const curr = s.history[s.history.length - 1];

  const velocity = curr - prev;

  // ───────── ignore tiny jitter ─────────
  const NOISE_GATE_BASE = 0.012;

    // increase tolerance if user is moving fast
    const adaptiveGate =
    NOISE_GATE_BASE + Math.min(0.01, Math.abs(s.velocity || 0) * 0.5);

    if (Math.abs(velocity) < adaptiveGate) return;

  // ───────── detect direction ─────────
  let dir = velocity > 0 ? "down" : "up";

  if (inverted) {
    dir = dir === "up" ? "down" : "up";
  }

  // ───────── initialize tracking state ─────────
  if (!s.lastDir) {
    s.lastDir = dir;
    return;
  }

  // ───────── detect direction change (KEY MOMENT) ─────────
  if (dir !== s.lastDir) {
    s.lastDir = dir;

    // stage progression (fast + forgiving)
    if (s.stage === 0 && dir === "down") s.stage = 1;
    else if (s.stage === 1 && dir === "up") s.stage = 2;
    else if (s.stage === 2 && dir === "down") s.stage = 3;
    else if (s.stage === 3 && dir === "up") {
      s.stage = 0;
      
      setCount(c => {
        const newCount = c + 1;

        console.log("67 DETECTED")

        if (roomRef.current && raceRef.current === "racing") {
          socket.emit("gesture_detected", {
            room_id: roomRef.current,
            user_id: String(userRef.current)
          });
        }

      return newCount;
    });

    }
  }
}

  function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}