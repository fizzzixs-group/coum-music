import { useEffect, useState } from "react";

import { api, humanError } from "@/api/backend";
import type { Track } from "@/api/types";
import { IconPlay } from "@/components/Icons";
import { TrackList } from "@/components/TrackList";
import { trackCount } from "@/lib/format";
import { usePlayer } from "@/store/player";
import type { Route } from "@/store/nav";

type Props = { route: Extract<Route, { name: "artist" }> };

/** Все треки исполнителя — открывается по клику на его имя. */
export function ArtistView({ route }: Props) {
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
      .artistTracks(route.id)
      .then((list) => !cancelled && setTracks(list))
      .catch((e) => !cancelled && setError(humanError(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [route.id]);

  const cover = tracks.find((t) => t.cover)?.cover ?? null;

  return (
    <div className="view scroll">
      <div className="page-head">
        <img className="page-head__cover" src={cover ?? undefined} alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">Исполнитель</div>
          <h1 className="page-head__title">{route.title}</h1>
          <div className="page-head__meta">
            {loading ? "Загружаю…" : trackCount(tracks.length)}
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
          Ищу треки…
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
