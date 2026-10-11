import { useCallback, useRef, useState } from "react";

type Props = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
};

/** Слайдер на pointer-событиях: одинаково работает мышью и тапом. */
export function Slider({ value, max, onChange, onCommit, disabled, ariaLabel, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const ratioFrom = useCallback((clientX: number): number => {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(ratioFrom(e.clientX) * max);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    onChange(ratioFrom(e.clientX) * max);
  };

  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    const next = ratioFrom(e.clientX) * max;
    onChange(next);
    onCommit?.(next);
  };

  const percent = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;

  return (
    <div
      ref={ref}
      className={`slider ${className ?? ""}`}
      data-dragging={dragging}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={(e) => {
        if (disabled) return;
        const step = e.shiftKey ? 30 : 5;
        if (e.key === "ArrowRight") onCommit?.(Math.min(value + step, max));
        if (e.key === "ArrowLeft") onCommit?.(Math.max(value - step, 0));
      }}
    >
      <div className="slider__track">
        <div className="slider__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="slider__knob" style={{ left: `${percent}%` }} />
    </div>
  );
}
