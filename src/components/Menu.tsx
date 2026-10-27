import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

/**
 * Момент последнего закрытия меню.
 *
 * Клик по «трём точкам» при открытом меню сначала закрывает его (обработчик
 * снаружи), а потом приходит click и открывает заново — меню «мигало».
 * Поэтому в течение мгновения после закрытия открывать запрещено, и
 * повторное нажатие честно закрывает меню.
 */
let closedAt = 0;

export function canOpenMenu(): boolean {
  return Date.now() - closedAt > 280;
}

/** Всплывающее меню в стиле M3: крупные радиусы, тонкая обводка, без острых углов. */
export function Menu({ x, y, entries, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });
  const [closing, setClosing] = useState(false);

  // Закрываем через короткую анимацию, а не мгновенно: иначе меню
  // «пропадает» рывком, что выглядит дёшево.
  const requestClose = useCallback((): void => {
    setClosing((was) => {
      if (!was) {
        setTimeout(onClose, 150);
      }
      return true;
    });
  }, [onClose]);

  // Позиция считается без замеров DOM.
  //
  // Замеры «после отрисовки» давали неверную ширину (шрифт ещё не встал),
  // из-за этого меню прижималось к самой рамке. Здесь ширина фиксирована
  // в CSS, а высота оценивается по числу пунктов — расчёт детерминированный.
  useLayoutEffect(() => {
    const MARGIN = 14;
    const WIDTH = 300; // совпадает с width в CSS
    const rowHeight = 48;
    const SEP = 18;
    const PADDING = 20;
    const estimated =
      entries.reduce((sum, e) => sum + (e === "sep" ? SEP : rowHeight), PADDING) + 16;

    const maxW = window.innerWidth - WIDTH - MARGIN;
    const left = Math.max(MARGIN, Math.min(x, maxW));

    let top = y;
    if (y + estimated > window.innerHeight - MARGIN) {
      const above = y - estimated - 8;
      top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - estimated - MARGIN);
    }

    setPos({ left, top, visible: true });
  }, [x, y, entries]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        closedAt = Date.now();
        requestClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    const close = () => requestClose();

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

  const menu = (
    <div
      ref={ref}
      className={closing ? "menu menu--closing" : "menu"}
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

  // Портал в body: иначе меню обрезается прокручиваемым списком,
  // внутри которого лежит кнопка «три точки».
  return createPortal(menu, document.body);
}
