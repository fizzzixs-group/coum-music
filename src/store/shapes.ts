/** Формы элементов: у каждого — свои волны, глубина и включение. */

import { create } from "zustand";

export type ShapeTarget =
  | "play"
  | "back"
  | "next"
  | "cover"
  | "artist"
  | "album"
  | "mini"
  | "dots"
  | "like";

export type ShapeItem = {
  /** Включена ли форма для этого элемента. */
  on: boolean;
  /** Сколько «волн» по кругу. */
  bumps: number;
  /** Глубина волн в процентах радиуса. */
  depth: number;
};

export type ShapeMap = Record<ShapeTarget, ShapeItem>;

export const TARGETS: { id: ShapeTarget; label: string; hint: string }[] = [
  { id: "play", label: "Играть / пауза", hint: "главная кнопка" },
  { id: "back", label: "Назад", hint: "предыдущий трек" },
  { id: "next", label: "Вперёд", hint: "следующий трек" },
  { id: "cover", label: "Обложка трека", hint: "на «Моей волне»" },
  { id: "artist", label: "Кружок артиста", hint: "аватарки исполнителей" },
  { id: "album", label: "Обложки альбомов", hint: "карточки в поиске" },
  { id: "mini", label: "Мини-обложка", hint: "в списках треков" },
  { id: "dots", label: "Три точки", hint: "кнопки меню" },
  { id: "like", label: "Лайк", hint: "сердечко на треке" },
];

const KEY = "coum.shapes.v2";

const PRESET: Record<ShapeTarget, ShapeItem> = {
  play: { on: true, bumps: 0, depth: 0 },
  back: { on: true, bumps: 0, depth: 0 },
  next: { on: true, bumps: 0, depth: 0 },
  cover: { on: true, bumps: 8, depth: 16 },
  artist: { on: false, bumps: 0, depth: 0 },
  album: { on: false, bumps: 0, depth: 0 },
  mini: { on: false, bumps: 0, depth: 0 },
  dots: { on: false, bumps: 0, depth: 0 },
  like: { on: false, bumps: 0, depth: 0 },
};

export const SHAPE_PRESETS: { id: string; label: string; bumps: number; depth: number }[] = [
  { id: "circle", label: "Круг", bumps: 0, depth: 0 },
  { id: "cookie", label: "Печенька", bumps: 8, depth: 16 },
  { id: "sun", label: "Солнце", bumps: 12, depth: 10 },
  { id: "flower", label: "Цветок", bumps: 5, depth: 24 },
  { id: "clover", label: "Клевер", bumps: 4, depth: 18 },
];

/** Собирает многоугольник с волнистым краем (та же формула, что и раньше). */
export function shapePolygon(bumps: number, depth: number): string {
  if (bumps <= 0 || depth <= 0) return "none";

  const steps = Math.max(96, bumps * 12);
  const points: string[] = [];
  const dip = Math.min(depth, 45) / 100;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wave = (1 - Math.cos(bumps * angle)) / 2;
    const radius = 50 - wave * dip * 50;
    points.push(
      `${(50 + radius * Math.cos(angle)).toFixed(2)}% ${(50 + radius * Math.sin(angle)).toFixed(2)}%`,
    );
  }

  return `polygon(${points.join(", ")})`;
}

function read(): ShapeMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return PRESET;
    const parsed = JSON.parse(raw) as Partial<ShapeMap>;
    const merged = { ...PRESET };
    for (const target of Object.keys(PRESET) as ShapeTarget[]) {
      const item = parsed[target];
      if (item) {
        merged[target] = {
          on: !!item.on,
          bumps: typeof item.bumps === "number" ? item.bumps : PRESET[target].bumps,
          depth: typeof item.depth === "number" ? item.depth : PRESET[target].depth,
        };
      }
    }
    return merged;
  } catch {
    return PRESET;
  }
}

/** Раздаёт формы по CSS-переменным; каждая — своя. */
export function applyShapeDom(map: ShapeMap): void {
  const root = document.documentElement;
  for (const target of Object.keys(map) as ShapeTarget[]) {
    const item = map[target];
    // Отдельный выключатель не нужен: форма есть, пока заданы волны.
    const clip = item.bumps > 0 && item.depth > 0 ? shapePolygon(item.bumps, item.depth) : "none";
    root.style.setProperty(`--shape-${target}`, clip);
  }
}

type Store = {
  /** Подпрыгивают ли кнопки при наведении. */
  hover: boolean;
  setHover: (value: boolean) => void;
  map: ShapeMap;
  active: ShapeTarget;
  saved: boolean;
  setActive: (target: ShapeTarget) => void;
  update: (target: ShapeTarget, patch: Partial<ShapeItem>) => void;
  save: () => void;
  reset: () => void;
};

const initial = read();

export const useShapes = create<Store>()((set, get) => ({
  map: initial,
  active: "cover",
  saved: true,
  hover: localStorage.getItem("coum.hover") !== "0",
  setHover: (hover) => {
    localStorage.setItem("coum.hover", hover ? "1" : "0");
    document.documentElement.dataset.hover = hover ? "on" : "off";
    set({ hover });
  },

  setActive: (active) => set({ active }),

  update: (target, patch) => {
    const map = { ...get().map, [target]: { ...get().map[target], ...patch } };
    set({ map });
    // Сразу показываем результат — не надо каждый раз жать «Сохранить».
    applyShapeDom(map);
  },

  save: () => {
    const map = get().map;
    localStorage.setItem(KEY, JSON.stringify(map));
    applyShapeDom(map);
    set({ saved: true });
  },

  reset: () => {
    localStorage.removeItem(KEY);
    applyShapeDom(PRESET);
    set({ map: PRESET, saved: true });
  },
}));

if (typeof document !== "undefined") {
  applyShapeDom(initial);
  document.documentElement.dataset.hover =
    localStorage.getItem("coum.hover") !== "0" ? "on" : "off";
}
