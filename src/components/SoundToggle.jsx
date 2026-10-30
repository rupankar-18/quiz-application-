import { playSound } from "./audio";

export default function SoundToggle({ sound, setSound, theme }) {
  const handleToggle = () => {
    const nextSound = !sound;
    setSound(nextSound);
    if (nextSound) {
      playSound("correct", true);
    }
  };

  return (
    <button
      type="button"
      className={`stylish-sound-btn ${sound ? "sound-active" : "sound-muted"}`}
      onClick={handleToggle}
      aria-label={sound ? "Mute audio sound effects" : "Enable audio sound effects"}
      title={sound ? "Audio Enabled (Click to mute)" : "Audio Muted (Click to enable)"}
      style={{
        borderColor: sound ? (theme?.border || "rgba(255, 255, 255, 0.18)") : "rgba(255, 255, 255, 0.1)"
      }}
    >
      <span className="sound-icon-wrap">
        {sound ? "🔊" : "🔇"}
      </span>

      <span className="sound-label-wrap">
        <span className="sound-status-text">{sound ? "Audio On" : "Muted"}</span>
      </span>

      {/* Mini Equalizer Animated Waves */}
      <div className={`sound-equalizer-bars ${sound ? "animating" : "static"}`}>
        <span className="sound-eq-bar bar-1" style={sound && theme?.accent ? { background: theme.accent } : {}} />
        <span className="sound-eq-bar bar-2" style={sound && theme?.accent ? { background: theme.accent } : {}} />
        <span className="sound-eq-bar bar-3" style={sound && theme?.accent ? { background: theme.accent } : {}} />
      </div>
    </button>
  );
}
