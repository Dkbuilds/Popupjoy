"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

const buttons = [
  { label: "Burst A", x: 0.1, y: 0.1, color: "#3b82f6" },
  { label: "Burst B", x: 0.5, y: 0.1, color: "#22c55e" },
  { label: "Burst C", x: 0.9, y: 0.1, color: "#ef4444" },
  { label: "Burst D", x: 0.1, y: 0.5, color: "#facc15" },
  { label: "Burst E", x: 0.5, y: 0.5, color: "#a855f7" },
  { label: "Burst F", x: 0.9, y: 0.5, color: "#ec4899" },
  { label: "Burst G", x: 0.1, y: 0.9, color: "#6366f1" },
  { label: "Burst H", x: 0.5, y: 0.9, color: "#14b8a6" },
  { label: "Burst I", x: 0.9, y: 0.9, color: "#f97316" }
];

export default function Home() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("popupjoy-count");
    if (saved) setCount(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("popupjoy-count", String(count));
  }, [count]);

  const pop = (x: number, y: number) => {
    confetti({
      particleCount: 180,
      spread: 90,
      startVelocity: 45,
      origin: { x, y }
    });
    setCount(c => c + Math.floor(Math.random() * 100 + 50));
  };

  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ fontSize: 40, fontWeight: 800 }}>
        Confetti Click Therapy
      </h1>

      <p style={{ marginTop: 10 }}>
        Click any button to celebrate 🎉
      </p>

      <div
        style={{
          marginTop: 40,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          maxWidth: 500,
          marginInline: "auto"
        }}
      >
        {buttons.map(b => (
          <button
            key={b.label}
            onClick={() => pop(b.x, b.y)}
            style={{
              background: b.color,
              color: "#fff",
              padding: "20px 0",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: "pointer"
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>
        Celebrations triggered: {count}
      </h2>
    </main>
  );
}

