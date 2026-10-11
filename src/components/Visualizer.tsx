import { useEffect, useRef } from "react";

import { engine } from "@/audio/engine";
import { usePlayer } from "@/store/player";

type Props = {
  /** Сколько столбиков рисовать. */
  bars?: number;
  className?: string;
  /** Высота холста в CSS-пикселях. */
  height?: number;
};

/** Живой спектр: реальные частоты из анализатора, а не случайные числа. */
export function Visualizer({ bars = 10, className, height = 96 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playing = usePlayer((s) => s.playing);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const smoothed = new Array(bars).fill(0);
    let raf = 0;

    const paint = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, h);

      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#a8c7fa";
      const idle =
        getComputedStyle(document.documentElement).getPropertyValue("--surface-4").trim() ||
        "rgba(255,255,255,0.14)";

      const target = playingRef.current ? engine.levels(bars) : new Array(bars).fill(0);

      // Столбики узкие и по центру: широкие «плиты» перекрывали текст и выглядели грубо.
      const maxBar = 14;
      const gap = 10;
      const barWidth = Math.min(maxBar, (width - gap * (bars - 1)) / bars);
      const total = barWidth * bars + gap * (bars - 1);
      const left = (width - total) / 2;
      const radius = Math.min(barWidth / 2, 5);

      for (let i = 0; i < bars; i++) {
        // Вверх — быстро, вниз — плавно: так движение выглядит живее.
        const goal = Math.max(target[i] ?? 0, 0.03);
        smoothed[i] += (goal - smoothed[i]) * (goal > smoothed[i] ? 0.5 : 0.12);

        const barHeight = Math.max(4, smoothed[i] * h);
        const x = left + i * (barWidth + gap);
        const y = h - barHeight;

        ctx.fillStyle = idle;
        ctx.beginPath();
        ctx.roundRect(x, h - 4, barWidth, 4, radius);
        ctx.fill();

        ctx.globalAlpha = 0.6 + smoothed[i] * 0.4;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [bars]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height, display: "block" }}
      aria-hidden
    />
  );
}
