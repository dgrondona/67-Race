let audioCtx;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

export function resumeAudioIfNeeded() {
  const c = getAudioContext();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {});
  }
}

export function playCountdownTick() {
  const c = getAudioContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 740;
  osc.connect(gain);
  gain.connect(c.destination);
  const t = c.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  osc.start(t);
  osc.stop(t + 0.15);
}

export function playGoSound() {
  const c = getAudioContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.value = 1760;
  osc.connect(gain);
  gain.connect(c.destination);
  const t = c.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc.start(t);
  osc.stop(t + 0.36);
}
