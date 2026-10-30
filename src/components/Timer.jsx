export default function Timer({ time, total }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const urgent = time <= 3;
  return <div className="timer"><svg viewBox="0 0 60 60"><circle className="timer-track" cx="30" cy="30" r={radius} /><circle className="timer-value" cx="30" cy="30" r={radius} style={{ stroke: urgent ? "#ef4444" : "#10b981", strokeDasharray: circumference, strokeDashoffset: circumference - (time / total) * circumference }} /></svg><strong style={{ color: urgent ? "#ef4444" : "#fff" }}>{time}s</strong></div>;
}
