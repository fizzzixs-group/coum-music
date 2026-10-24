import { useEffect, useState } from "react";

import { api, humanError } from "@/api/backend";
import type { Track } from "@/api/types";
import { Cover } from "@/components/Cover";
import { IconPlay } from "@/components/Icons";
import { TrackList } from "@/components/TrackList";
import { trackCount } from "@/lib/format";
import { usePlayer } from "@/store/player";
import type { Route } from "@/store/nav";

type Props = { route: Extract<Route, { name: "album" }> };

/** Альбом целиком: открывается по клику на название альбома. */
export function AlbumView({ route }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTracks([]);

    void api
      .albumTracks(route.id)
      .then((list) => !cancelled && setTracks(list))
      .catch((e) => !cancelled && setError(humanError(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [route.id]);

  // Обложка альбома — это обложка его же треков.
  const cover = tracks.find((t) => t.cover)?.cover ?? null;
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return (
    <div className="view scroll">
      <div className="page-head">
        <Cover className="page-head__cover" src={cover} seed={route.id} alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">Альбом</div>
          <h1 className="page-head__title">{route.title}</h1>
          <div className="page-head__meta">
            {loading ? "Загружаю…" : trackCount(tracks.length)}
            {!loading && totalMs > 0 && (
              <>
                <span>·</span>
                <span>{Math.round(totalMs / 60000)} мин</span>
              </>
            )}
          </div>
          <div className="page-head__actions">
            <button
              className="btn-primary"
              disabled={tracks.length === 0}
              onClick={() => void playTracks(tracks, 0, null)}
            >
              <IconPlay size={16} />
              Играть
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-bar">{error}</div>}

      {loading && tracks.length === 0 && (
        <div className="loading">
          <div className="spinner" />
          Загружаю альбом…
        </div>
      )}

      {!loading && tracks.length === 0 && !error && (
        <div className="empty">
          <div className="empty__title">Треков не нашлось</div>
        </div>
      )}

      {tracks.length > 0 && (
        <TrackList tracks={tracks} onPlayIndex={(i) => void playTracks(tracks, i, null)} />
      )}
    </div>
  );
}
