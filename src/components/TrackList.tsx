import { useEffect, useRef, useState } from "react";

import type { Track } from "@/api/types";
import type { MenuEntry } from "@/components/Menu";
import { currentTrack, usePlayer } from "@/store/player";
import { TrackRow } from "./TrackRow";

type Props = {
  tracks: Track[];
  /** С чего начинать, если трек-лист не является текущей очередью. */
  onPlayIndex: (index: number) => void;
  /** Показывать строку с номером/названием/альбомом. */
  withHead?: boolean;
  /** Дополнительные пункты в меню трека (например, удаление из плейлиста). */
  menuExtra?: (track: Track) => MenuEntry[];
};

/** Сколько строк рисуем сразу и сколько добавляем при прокрутке. */
const CHUNK = 60;

/**
 * Список треков.
 *
 * Большие списки (у «Мне нравится» бывает и 700 треков) нельзя рисовать
 * целиком: браузер строит сотни строк с картинками, и вкладка подвисает
 * на несколько секунд. Поэтому сначала показываем первую порцию, а
 * остальные подгружаем по мере прокрутки — незаметно для человека.
 */
export function TrackList({ tracks, onPlayIndex, withHead = true, menuExtra }: Props) {
  const current = usePlayer(currentTrack);
  const playing = usePlayer((s) => s.playing);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);

  const [limit, setLimit] = useState(Math.min(CHUNK, tracks.length));
  const sentinel = useRef<HTMLDivElement>(null);

  // Сменился список — начинаем с первой порции.
  useEffect(() => {
    setLimit(Math.min(CHUNK, tracks.length));
  }, [tracks]);

  // Догружаем, когда до конца списка остаётся примерно экран прокрутки.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || limit >= tracks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLimit((prev) => Math.min(prev + CHUNK, tracks.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit, tracks.length]);

  // Список считается «своим» для плеера, только если очередь совпадает с ним
  // один в один — иначе подсветка сработала бы на чужом списке той же длины.
  const isOwnQueue =
    tracks.length > 0 &&
    queue.length === tracks.length &&
    queue.every((t, i) => t.id === tracks[i].id);

  const visible = tracks.slice(0, limit);
  const hidden = tracks.length - visible.length;

  return (
    <div className="tracklist">
      {withHead && (
        <div className="tracklist__head">
          <span>#</span>
          <span>Трек</span>
          <span>Альбом</span>
          <span style={{ textAlign: "right" }}>Время</span>
          <span />
          <span />
        </div>
      )}
      {visible.map((track, i) => (
        <TrackRow
          key={`${track.id}-${i}`}
          track={track}
          index={i}
          isCurrent={isOwnQueue && index === i}
          isPlaying={playing && current?.id === track.id}
          onPlay={() => onPlayIndex(i)}
          menuExtra={menuExtra?.(track)}
        />
      ))}

      {hidden > 0 && (
        <div ref={sentinel} className="tracklist__more">
          <button
            className="btn-ghost"
            onClick={() => setLimit((prev) => Math.min(prev + CHUNK, tracks.length))}
          >
            Показать ещё {Math.min(CHUNK, hidden)}
          </button>
          <span className="tracklist__more-count">
            показано {visible.length} из {tracks.length}
          </span>
        </div>
      )}
    </div>
  );
}
