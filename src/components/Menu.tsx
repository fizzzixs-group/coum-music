import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type MenuItemDef = {
  id: string;
  title: string;
  sub?: string;
  icon?: ReactNode;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export type MenuEntry = MenuItemDef | "sep";

type Props = {
  x: number;
  y: number;
  entries: MenuEntry[];
  onClose: () => void;
};

/** Всплывающее меню в стиле M3: крупные радиусы, тонкая обводка, без острых углов. */
export function Menu({ x, y, entries, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });

  // Держим меню внутри окна: если не влезает вниз — раскрываем вверх.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 10;
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = Math.max(margin, y - rect.height - 8);
    }

    setPos({ left, top, visible: true });
  }, [x, y]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const close = () => onClose();

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("wheel", close, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("wheel", close);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="menu"
      role="menu"
      style={{ left: pos.left, top: pos.top, visibility: pos.visible ? "visible" : "hidden" }}
    >
      {entries.map((entry, i) =>
        entry === "sep" ? (
          <div key={`sep-${i}`} className="menu__sep" />
        ) : (
          <button
            key={entry.id}
            className="menu__item"
            role="menuitem"
            data-danger={entry.danger}
            data-active={entry.active}
            disabled={entry.disabled}
            onClick={() => {
              entry.onSelect();
              onClose();
            }}
          >
            {entry.icon && <span className="menu__icon">{entry.icon}</span>}
            <span className="menu__text">
              <span className="menu__title">{entry.title}</span>
              {entry.sub && <span className="menu__sub">{entry.sub}</span>}
            </span>
          </button>
        ),
      )}
    </div>
  );
}
