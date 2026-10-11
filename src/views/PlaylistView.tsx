import { useEffect, useState } from "react";

import { api, humanError } from "@/api/backend";
import type { PlaylistDetail } from "@/api/types";
import { Cover } from "@/components/Cover";
import { IconPlay } from "@/components/Icons";
import { TrackList } from "@/components/TrackList";
import { formatTime, plural, trackCount } from "@/lib/format";
import { usePlayer } from "@/store/player";
import type { Route } from "@/store/nav";

type Props = { route: Extract<Route, { name: "playlist" }> };

export function PlaylistView({ route }: Props) {
  const [data, setData] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const detail = await api.playlist(route.uid, route.kind);
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) setError(humanError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route.uid, route.kind]);

  if (loading) {
    return (
      <div className="view scroll">
        <div className="loading">
          <div className="spinner" />
          Загружаю плейлист…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="view scroll">
        <div className="error-bar">{error ?? "Плейлист не найден"}</div>
      </div>
    );
  }

  const { playlist, tracks } = data;
  const playable = tracks.filter((t) => t.available);
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return (
    <div className="view scroll">
      <div className="page-head">
        <Cover
          className="page-head__cover"
          src={playlist.cover}
          seed={`${playlist.uid}:${playlist.kind}`}
          alt=""
        />
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            {playlist.isMine ? "Мой плейлист" : `Плейлист · ${playlist.ownerName}`}
          </div>
          <h1 className="page-head__title">{playlist.title}</h1>
          <div className="page-head__meta">
            <span>{trackCount(tracks.length)}</span>
            {totalMs > 0 && (
              <>
                <span>·</span>
                <span>
                  {plural(Math.max(1, Math.round(totalMs / 60000)), "минута", "минуты", "минут")}
                </span>
              </>
            )}
            {playlist.description && (
              <>
                <span>·</span>
                <span className="truncate" style={{ maxWidth: 420 }}>
                  {playlist.description}
                </span>
              </>
            )}
          </div>
          <div className="page-head__actions">
            <button
              className="btn-primary"
              disabled={playable.length === 0}
              onClick={() =>
                void playTracks(tracks, Math.max(0, tracks.findIndex((t) => t.available)), {
                  kind: "playlist",
                  uid: playlist.uid,
                  kind_: playlist.kind,
                  title: playlist.title,
                })
              }
            >
              <IconPlay size={16} />
              Играть
            </button>
            <span style={{ fontSize: 12, color: "var(--text-mute)" }}>
              {totalMs > 0 && `Общая длина ${formatTime(totalMs)}`}
            </span>
          </div>
        </div>
      </div>

      <TrackList
        tracks={tracks}
        onPlayIndex={(i) =>
          void playTracks(tracks, i, {
            kind: "playlist",
            uid: playlist.uid,
            kind_: playlist.kind,
            title: playlist.title,
          })
        }
      />
    </div>
  );
}
