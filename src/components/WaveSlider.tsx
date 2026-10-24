import { useCallback, useRef, useState } from "react";

import { usePlayer } from "@/store/player";

type Props = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Ползунок прогресса в виде волны.
 *
 * Волна есть только в прослушанной части — ровно по прогрессу трека.
 * Дальше идёт тонкая прямая линия: там музыки ещё не было, и волноваться
 * нечему. Сама волна всё время бежит вправо, как течение.
 */
export function WaveSlider({ value, max, onChange, onCommit, ariaLabel, className, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // На паузе волна останавливается, но не исчезает.
  const playing = usePlayer((s) => s.playing);

  const ratioFrom = useCallback((clientX: number): number => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const percent = ratio * 100;

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(ratioFrom(e.clientX) * max);
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onChange(ratioFrom(e.clientX) * max);
  };

  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    const next = ratioFrom(e.clientX) * max;
    onChange(next);
    onCommit?.(next);
  };

  return (
    <div
      ref={ref}
      className={`waveslider ${className ?? ""}`}
      data-dragging={dragging}
      data-playing={playing}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 30 : 5;
        if (e.key === "ArrowRight") onCommit?.(Math.min(value + step, max));
        if (e.key === "ArrowLeft") onCommit?.(Math.max(value - step, 0));
      }}
    >
      {/* Непрослушанная часть: тонкая ровная линия. */}
      <div className="waveslider__rest" />

      {/* Прослушанная часть: волна, обрезанная по прогрессу. Волна — повтор
          одной и той же фигуры, поэтому её форма не зависит от ширины. */}
      <div className="waveslider__fill" style={{ width: `${percent}%` }}>
        <div className="waveslider__pattern" />
        <div className="waveslider__cap" />
      </div>

      <div className="waveslider__knob" style={{ left: `${percent}%` }} />
    </div>
  );
}
