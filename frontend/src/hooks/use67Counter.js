import { useRef, useState } from "react";

export default function use67Counter() {
  const [count, setCount] = useState(0);

  const state = useRef({
    left: {
      lastDir: null,
      stage: 0
    },
    right: {
      lastDir: null,
      stage: 0
    }
  });

  const THRESHOLD = 0.02;

  function getDirection(prevY, y) {
    const diff = y - prevY;

    if (Math.abs(diff) < THRESHOLD) return null;

    return diff > 0 ? "down" : "up";
  }

  function updateWrist(side, y, inverted = false) {
    const s = state.current[side];

    if (s.prevY === undefined) {
      s.prevY = y;
      return;
    }

    let dir = getDirection(s.prevY, y);
    s.prevY = y;

    if (!dir) return;

    // invert logic for right hand (your rule)
    if (inverted) {
      dir = dir === "up" ? "down" : "up";
    }

    // STATE MACHINE (direction-change based)
    if (s.stage === 0 && dir === "down") {
      s.stage = 1;
    } else if (s.stage === 1 && dir === "up") {
      s.stage = 2;
    } else if (s.stage === 2 && dir === "down") {
      s.stage = 3;
    } else if (s.stage === 3 && dir === "up") {
      s.stage = 0;
      setCount((c) => c + 1);
    }
  }

  return {
    count,
    updateWrist
  };
}