import { useRef, useState } from "react";

export default function use67Counter() {
  const [count, setCount] = useState(0);

  const state = useRef({
    left: {
      y: null,
      smoothY: null,
      velocity: 0,
      lastDir: null,
      stage: 0
    },
    right: {
      y: null,
      smoothY: null,
      velocity: 0,
      lastDir: null,
      stage: 0
    }
  });

  const SMOOTH_ALPHA = 0.25;   // lower = smoother but slower
  const VEL_ALPHA = 0.3;       // velocity smoothing
  const MIN_VELOCITY = 0.004;  // ignore jitter noise

  function updateWrist(side, y, inverted = false) {
    const s = state.current[side];

    if (s.smoothY === null) {
      s.smoothY = y;
      s.y = y;
      return;
    }

    s.smoothY =
      SMOOTH_ALPHA * y + (1 - SMOOTH_ALPHA) * s.smoothY;

    const rawVelocity = s.smoothY - s.y;

    s.velocity =
      VEL_ALPHA * rawVelocity + (1 - VEL_ALPHA) * s.velocity;

    s.y = s.smoothY;

    if (Math.abs(s.velocity) < MIN_VELOCITY) return;

    let dir = s.velocity > 0 ? "down" : "up";

    if (inverted) {
      dir = dir === "up" ? "down" : "up";
    }

    // prevent rapid flip-flopping from noise
    if (s.lastDir === dir) return;
    s.lastDir = dir;

    if (s.stage === 0 && dir === "down") {
      s.stage = 1;
    } 
    else if (s.stage === 1 && dir === "up") {
      s.stage = 2;
    } 
    else if (s.stage === 2 && dir === "down") {
      s.stage = 3;
    } 
    else if (s.stage === 3 && dir === "up") {
      s.stage = 0;
      setCount((c) => c + 1);
    }
  }

  return {
    count,
    updateWrist
  };
}