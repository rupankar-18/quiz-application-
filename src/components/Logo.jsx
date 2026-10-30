export default function Logo({ size = 38, theme }) {
  return (
    <div className="dynamic-logo-wrapper" style={{ width: `${size}px`, height: `${size}px` }}>
      {/* Dynamic Ambient Aura Glow (Always Breathing with Theme Accent) */}
      <div className="logo-ambient-glow" />

      {/* Dynamic Continuous Orbital Ring (Always Spinning) */}
      <div className="logo-orbit-spinner" />

      {/* Core Dynamic Vector Emblem */}
      <svg
        className="dynamic-logo-svg"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="QuizPulse Dynamic Logo"
      >
        <defs>
          <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent, #3b82f6)" />
            <stop offset="60%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="var(--accent, #3b82f6)" />
          </linearGradient>

          <linearGradient id="badgeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
          </linearGradient>

          <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Badge Base */}
        <rect
          x="3"
          y="3"
          width="38"
          height="38"
          rx="11"
          className="logo-badge-plate"
        />

        {/* Subtle Inner Border */}
        <rect
          x="3.5"
          y="3.5"
          width="37"
          height="37"
          rx="10.5"
          className="logo-badge-inner-stroke"
        />

        {/* Orbiting Radar Sweep Track */}
        <circle
          cx="22"
          cy="22"
          r="16.5"
          className="logo-orbit-track"
        />

        {/* Always-Running Orbit Arc */}
        <circle
          cx="22"
          cy="22"
          r="16.5"
          className="logo-orbit-runner"
        />

        {/* Pulse Wave Guide Path (Static Background Stroke) */}
        <path
          d="M 6.5 22.5 L 13.5 22.5 L 16.5 17.5 L 20 27.5 L 24 13 L 28 26 L 31 22.5 L 37.5 22.5"
          className="logo-waveform-bg"
        />

        {/* Dynamic Running Laser Pulse Beam (Always Flowing Through Wave) */}
        <path
          d="M 6.5 22.5 L 13.5 22.5 L 16.5 17.5 L 20 27.5 L 24 13 L 28 26 L 31 22.5 L 37.5 22.5"
          className="logo-waveform-laser"
          filter="url(#laserGlow)"
        />

        {/* Live Spark Beacon Dot (Pulses at the Wave Apex) */}
        <circle
          cx="24"
          cy="13"
          r="2.2"
          className="logo-spark-core"
        />

        {/* Live Radar Ripple Ring */}
        <circle
          cx="24"
          cy="13"
          r="4.5"
          className="logo-spark-ripple"
        />
      </svg>
    </div>
  );
}
