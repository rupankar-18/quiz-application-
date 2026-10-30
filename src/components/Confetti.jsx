import { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    window.addEventListener("resize", setSize);

    const colors = ["#a855f7", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      size: 4 + Math.random() * 6,
      speed: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 6
    }));

    let animation;
    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((piece) => {
        piece.y += piece.speed;
        piece.rotation += 0.08;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        context.restore();
        if (piece.y > canvas.height) piece.y = -20;
      });
      animation = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="confetti"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999
      }}
    />
  );
}

