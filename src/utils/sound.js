let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function tone(ac, freq, start, duration) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playNotificationSound() {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime;
    tone(ac, 880, now, 0.12);
    tone(ac, 1175, now + 0.1, 0.14);
  } catch { /* autoplay blocked or unsupported */ }
}
