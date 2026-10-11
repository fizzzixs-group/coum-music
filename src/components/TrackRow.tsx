import { useState } from "react";

import type { Track } from "@/api/types";
import { formatTime } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { Cover } from "./Cover";
import { IconHeart, IconMore, IconPause, IconPlay } from "./Icons";
import { TrackMenu } from "./TrackMenu";

type Props = {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
};

export function TrackRow({ track, index, isCurrent, isPlaying, onPlay }: Props) {
  const liked = useLibrary((s) => s.likedIds.has(track.id));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const openMenu = (x: number, y: number) => setMenu({ x, y });

  return (
    <>
      <div
        className="track-row"
        data-current={isCurrent}
        data-unavailable={!track.available}
        onDoubleClick={onPlay}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay();
          }
        }}
      >
        <div className="track-row__lead">
          <Cover className="track-row__cover" src={track.cover} seed={track.id} alt="" />
          <button
            className="track-row__index"
            data-visible={isCurrent}
            onClick={onPlay}
            aria-label={isCurrent && isPlaying ? "Пауза" : "Играть"}
          >
            {isCurrent && isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
          </button>
        </div>

        <div className="track-row__text">
          <span className="track-row__title">
            {isCurrent && (
              <span className="eq" data-paused={!isPlaying}>
                <i />
                <i />
                <i />
              </span>
            )}
            {track.title}
          </span>
          <span className="track-row__artist">
            {track.artistList.length > 0
              ? track.artistList.map((artist, i) => (
                  <span key={artist.id}>
                    {i > 0 && ", "}
                    <button
                      className="artist-link"
                      title={`Все треки: ${artist.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        useNav.getState().go({ name: "artist", id: artist.id, title: artist.name });
                      }}
                    >
                      {artist.name}
                    </button>
                  </span>
                ))
              : track.artists}
          </span>
        </div>

        <span className="track-row__album">{track.album}</span>
        <span className="track-row__time">
          {track.available ? formatTime(track.durationMs) : "—"}
        </span>

        <button
          className="track-row__action"
          data-on={liked}
          aria-label={liked ? "Убрать из избранного" : "В избранное"}
          onClick={(e) => {
            e.stopPropagation();
            void toggleLike(track);
          }}
        >
          <IconHeart size={18} filled={liked} />
        </button>

        <button
          className="track-row__action"
          aria-label="Ещё"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            openMenu(rect.right, rect.bottom + 6);
          }}
        >
          <IconMore size={18} />
        </button>
        <span className="sr-only">Трек {index + 1}</span>
      </div>

      {menu && <TrackMenu track={track} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </>
  );
}
