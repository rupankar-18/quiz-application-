export function playSound(type, enabled) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = type === "correct" ? 660 : type === "wrong" ? 160 : type === "tick" ? 880 : 420;
    oscillator.type = type === "wrong" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(type === "tick" ? 0.06 : 0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (type === "correct" ? 0.2 : 0.08));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (type === "correct" ? 0.2 : 0.08));
  } catch {
    // Audio can be blocked by the browser.
  }
}
