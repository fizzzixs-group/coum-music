import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

/** Быстрые цвета: как «основные цвета» в Paint. */
const PRESETS = [
  "#ff4d4d", "#ff7a18", "#ffb020", "#ffe14a", "#c3e84a", "#7ddc4a",
  "#3ddc84", "#2fd0a8", "#4dd0e1", "#4a9eff", "#5b8dff", "#7c6cff",
  "#b79cff", "#d78cff", "#ff8fc0", "#ff6fa5", "#ffffff", "#cfcfd6",
  "#8f8f9c", "#5a5a66", "#35353d", "#22222a", "#101014", "#000000",
];

const HUE_GRADIENT =
  "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16) || 0;
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`;
}

/**
 * Выбор цвета как в Paint: квадрат «насыщенность × яркость», ползунок
 * оттенка, поле HEX и набор быстрых цветов.
 */
export function ColorPicker({ value, onChange }: Props) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [draft, setDraft] = useState(value.toUpperCase());
  const square = useRef<HTMLDivElement>(null);
  const hueBar = useRef<HTMLDivElement>(null);

  // Пришёл новый цвет снаружи — подстраиваем состояние.
  useEffect(() => {
    setHsv(hexToHsv(value));
    setDraft(value.toUpperCase());
  }, [value]);

  const apply = (next: { h: number; s: number; v: number }) => {
    setHsv(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  };

  const dragSquare = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = square.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp01((e.clientX - rect.left) / rect.width);
    const v = 1 - clamp01((e.clientY - rect.top) / rect.height);
    apply({ h: hsv.h, s, v });
  };

  const dragHue = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = hueBar.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = clamp01((e.clientY - rect.top) / rect.height);
    apply({ ...hsv, h: ratio * 360 });
  };

  const hueColor = hsvToHex(hsv.h, 1, 1);

  return (
    <div className="cp">
      <div className="cp__top">
        <div
          ref={square}
          className="cp__square"
          style={{
            background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hueColor})`,
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragSquare(e);
          }}
          onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && dragSquare(e)}
        >
          <span
            className="cp__dot"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
          />
        </div>

        <div
          ref={hueBar}
          className="cp__hue"
          style={{ background: HUE_GRADIENT }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragHue(e);
          }}
          onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && dragHue(e)}
        >
          <span className="cp__hue-mark" style={{ top: `${(hsv.h / 360) * 100}%` }} />
        </div>

        <div className="cp__preview" style={{ background: value }} />
      </div>

      <div className="cp__hex">
        <input
          className="modal__input"
          value={draft}
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(next)) onChange(next.toLowerCase());
          }}
          aria-label="Цвет в формате HEX"
        />
      </div>

      <div className="cp__presets">
        {PRESETS.map((c) => (
          <button
            key={c}
            className="cp__preset"
            style={{ background: c }}
            aria-label={c}
            data-same={c.toLowerCase() === value.toLowerCase()}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}
