import { useEffect, useState } from "react";

import { api, humanError } from "@/api/backend";
import type { SearchResult } from "@/api/types";
import { Cover } from "@/components/Cover";
import { TrackList } from "@/components/TrackList";
import { trackCount } from "@/lib/format";
import { useNav } from "@/store/nav";
import { usePlayer } from "@/store/player";

const EMPTY: SearchResult = { tracks: [], albums: [], artists: [], playlists: [] };

export function SearchView() {
  const query = useNav((s) => s.searchQuery);
  const go = useNav((s) => s.go);
  const playTracks = usePlayer((s) => s.playTracks);

  const [result, setResult] = useState<SearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const text = query.trim();
    if (text.length === 0) {
      setResult(EMPTY);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.search(text);
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(humanError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const nothingFound =
    !loading &&
    query.trim().length > 0 &&
    result.tracks.length === 0 &&
    result.albums.length === 0 &&
    result.artists.length === 0 &&
    result.playlists.length === 0;

  return (
    <div className="view search-view scroll">
      <h1 className="search-view__title">
        {query.trim() ? `Поиск: ${query.trim()}` : "Поиск"}
      </h1>
      <p className="search-view__sub">
        {query.trim()
          ? loading
            ? "Ищу…"
            : `Треков: ${result.tracks.length}, исполнителей: ${result.artists.length}, альбомов: ${result.albums.length}`
          : "Начни печатать — или нажми Ctrl+K, чтобы прыгнуть в строку поиска."}
      </p>

      {error && <div className="error-bar">{error}</div>}

      {nothingFound && (
        <div className="empty">
          <div className="empty__title">Ничего не нашлось</div>
          <p>Попробуй другое написание или проверь раскладку.</p>
        </div>
      )}

      {result.artists.length > 0 && (
        <>
          <h2 className="section-title">
            Исполнители <span>{result.artists.length}</span>
          </h2>
          <div className="card-grid">
            {result.artists.slice(0, 8).map((a) => (
              <div className="card" key={a.id}>
                <Cover className="card__cover card__cover--round" src={a.cover} seed={a.id} alt="" round />
                <div className="card__title">{a.name}</div>
                <div className="card__sub">исполнитель</div>
              </div>
            ))}
          </div>
        </>
      )}

      {result.tracks.length > 0 && (
        <>
          <h2 className="section-title">
            Треки <span>{result.tracks.length}</span>
          </h2>
          <div style={{ margin: "0 -26px" }}>
            <TrackList
              tracks={result.tracks}
              withHead={false}
              onPlayIndex={(i) =>
                void playTracks(result.tracks, i, { kind: "search", title: query.trim() })
              }
            />
          </div>
        </>
      )}

      {result.albums.length > 0 && (
        <>
          <h2 className="section-title">
            Альбомы <span>{result.albums.length}</span>
          </h2>
          <div className="card-grid">
            {result.albums.slice(0, 12).map((a) => (
              <div className="card" key={a.id}>
                <Cover className="card__cover" src={a.cover} seed={a.id} alt="" />
                <div className="card__title">{a.title}</div>
                <div className="card__sub">
                  {a.artists}
                  {a.year ? ` · ${a.year}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {result.playlists.length > 0 && (
        <>
          <h2 className="section-title">
            Плейлисты <span>{result.playlists.length}</span>
          </h2>
          <div className="card-grid">
            {result.playlists.slice(0, 12).map((p) => (
              <button
                className="card"
                key={`${p.uid}:${p.kind}`}
                onClick={() => go({ name: "playlist", uid: p.uid, kind: p.kind, title: p.title })}
              >
                <Cover className="card__cover" src={p.cover} seed={`${p.uid}:${p.kind}`} alt="" />
                <div className="card__title">{p.title}</div>
                <div className="card__sub">
                  {p.ownerName} · {trackCount(p.trackCount)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
