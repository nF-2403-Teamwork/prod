// Synthesised notification tone. Web Audio rather than an asset keeps it out of
// the bundle and lets the pref be verified for real from the settings screen.
let ctx = null;

function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Autoplay policy parks the context until a gesture unlocks it.
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Two-note "ping". Returns false when Web Audio is unavailable so callers can
// avoid claiming a sound played.
export function playPing() {
  const ac = context();
  if (!ac) return false;

  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.14;
  master.connect(ac.destination);

  [
    { freq: 880, at: 0, dur: 0.12 },
    { freq: 1320, at: 0.1, dur: 0.22 },
  ].forEach(({ freq, at, dur }) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(1, now + at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + at);
    osc.stop(now + at + dur + 0.02);
  });

  return true;
}
