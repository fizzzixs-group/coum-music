import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { sourceLabel } from "@/api/types";
import { Cover } from "@/components/Cover";
import { IconPause, IconPlay, IconSparkle } from "@/components/Icons";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/store/player";

type Props = { x: number; y: number; onClose: () => void };

/**
 * Очередь в миниатюре: что играло, что играет и что дальше.
 * Открывается по клику на плашку с названием источника.
 */
export function QueuePopover({ x, y, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, visible: false });

  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playing = usePlayer((s) => s.playing);
  const source = usePlayer((s) => s.source);
  const playAt = usePlayer((s) => s.playAt);
  const startWave = usePlayer((s) => s.startWave);

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
    if (top < margin) top = margin;

    setPos({ left, top, visible: true });
  }, [x, y]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  // Показываем пару треков до текущего и запас вперёд.
  const from = Math.max(0, index - 2);
  const to = Math.min(queue.length, index + 18);
  const items = queue.slice(from, to);

  return (
    <div
      ref={ref}
      className="menu queue-pop"
      style={{ left: pos.left, top: pos.top, visibility: pos.visible ? "visible" : "hidden" }}
    >
      <div className="queue-pop__head">
        <span className="queue-pop__title">{sourceLabel(source)}</span>
        <span className="queue-pop__count">
          {index + 1} из {queue.length}
        </span>
      </div>

      <div className="queue-pop__list scroll">
        {items.map((track, i) => {
          const realIndex = from + i;
          const isCurrent = realIndex === index;
          return (
            <button
              key={`${track.id}-${realIndex}`}
              className="queue-pop__item"
              data-current={isCurrent}
              onClick={() => {
                if (!isCurrent) void playAt(realIndex);
              }}
            >
              <span className="queue-pop__lead">
                <Cover className="queue-pop__cover" src={track.cover} seed={track.id} alt="" />
                {isCurrent && (
                  <span className="queue-pop__state">
                    {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
                  </span>
                )}
              </span>
              <span className="queue-pop__text">
                <span className="queue-pop__name">{track.title}</span>
                <span className="queue-pop__artist">{track.artists}</span>
              </span>
              <span className="queue-pop__time">{formatTime(track.durationMs)}</span>
            </button>
          );
        })}
      </div>

      {source?.kind !== "wave" && (
        <>
          <div className="menu__sep" />
          <button
            className="menu__item"
            onClick={() => {
              void startWave();
              onClose();
            }}
          >
            <span className="menu__icon">
              <IconSparkle size={18} />
            </span>
            <span className="menu__text">
              <span className="menu__title">Включить Мою волну</span>
              <span className="menu__sub">заменит текущую очередь подбором</span>
            </span>
          </button>
        </>
      )}
    </div>
  );
}
