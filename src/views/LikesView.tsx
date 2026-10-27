import { useEffect, useState } from "react";

import { Cover } from "@/components/Cover";
import { IconPlay } from "@/components/Icons";
import { TrackList } from "@/components/TrackList";
import { formatTime, trackCount } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { usePlayer } from "@/store/player";

/** Раздел «Мне нравится» — фактически плейлист, но живёт в API отдельно. */
export function LikesView() {
  const storeTracks = useLibrary((s) => s.likedTracks);

  // Снимок списка: убираешь лайк — трек остаётся на месте, пока не уйдёшь
  // с вкладки. Иначе он исчезает мгновенно и его не вернуть.
  const [frozen, setFrozen] = useState<typeof storeTracks | null>(null);
  useEffect(() => {
    if (!frozen && storeTracks.length > 0) setFrozen(storeTracks);
  }, [storeTracks, frozen]);
  const tracks = frozen ?? storeTracks;
  const loading = useLibrary((s) => s.loadingLiked);
  const loadLiked = useLibrary((s) => s.loadLiked);
  const playTracks = usePlayer((s) => s.playTracks);

  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return (
    <div className="view scroll">
      <div className="page-head">
        <Cover
          className="page-head__cover"
          src={tracks[0]?.cover ?? null}
          seed="likes"
          alt=""
        />
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">Коллекция</div>
          <h1 className="page-head__title">Мне нравится</h1>
          <div className="page-head__meta">
            <span>{trackCount(tracks.length)}</span>
            {totalMs > 0 && (
              <>
                <span>·</span>
                <span>{formatTime(totalMs)}</span>
              </>
            )}
          </div>
          <div className="page-head__actions">
            <button
              className="btn-primary"
              disabled={tracks.length === 0}
              onClick={() => void playTracks(tracks, 0, { kind: "likes" })}
            >
              <IconPlay size={16} />
              Играть
            </button>
            <button className="btn-ghost" onClick={() => void loadLiked()}>
              Обновить
            </button>
          </div>
        </div>
      </div>

      {loading && tracks.length === 0 ? (
        <div className="loading">
          <div className="spinner" />
          Загружаю избранное…
        </div>
      ) : tracks.length === 0 ? (
        <div className="empty">
          <div className="empty__title">Пока пусто</div>
          <p>Лайкай треки — они появятся здесь и в Яндекс.Музыке.</p>
        </div>
      ) : (
        <TrackList tracks={tracks} onPlayIndex={(i) => void playTracks(tracks, i, { kind: "likes" })} />
      )}
    </div>
  );
}
