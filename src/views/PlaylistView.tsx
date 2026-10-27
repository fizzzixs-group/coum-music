import { useEffect, useState } from "react";

import { open } from "@tauri-apps/plugin-dialog";

import { api, humanError } from "@/api/backend";
import type { PlaylistDetail, Track } from "@/api/types";
import { Cover } from "@/components/Cover";
import { IconPlay, IconTrash } from "@/components/Icons";
import { Menu, type MenuEntry } from "@/components/Menu";
import { TrackList } from "@/components/TrackList";
import { formatTime, plural, trackCount } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { usePlayer } from "@/store/player";
import type { Route } from "@/store/nav";

type Props = { route: Extract<Route, { name: "playlist" }> };

export function PlaylistView({ route }: Props) {
  const [data, setData] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [ownCover, setOwnCover] = useState<string | null>(null);
  const playTracks = usePlayer((s) => s.playTracks);
  const setNotice = usePlayer((s) => s.setNotice);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    (async () => {
      try {
        const detail = await api.playlist(route.uid, route.kind);
        if (!cancelled) setData(detail);

        // Своя обложка хранится локально — читаем её при каждом открытии.
        try {
          const saved = await api.playlistCover(route.kind);
          if (!cancelled && saved) setOwnCover(saved);
        } catch {
          // нет сохранённой — покажем серверную
        }
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

  const removeTrack = async (track: Track) => {
    if (busy || !data) return;
    setBusy(true);
    const backup = data;
    setData({ ...data, tracks: data.tracks.filter((t) => t.id !== track.id) });

    try {
      await api.playlistRemoveTrack(route.kind, track.id);
      setNotice(`«${track.title}» убрали из плейлиста`);
      void useLibrary.getState().refreshPlaylists();
    } catch (e) {
      setData(backup);
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  // ── Меню карандаша ────────────────────────────────────────────────
  const applyRename = async () => {
    if (!data || !renaming?.trim()) return;
    setBusy(true);
    try {
      await api.playlistRename(route.kind, renaming.trim());
      setData({ ...data, playlist: { ...data.playlist, title: renaming.trim() } });
      setRenaming(null);
      setNotice("Название изменено");
      void useLibrary.getState().refreshPlaylists();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const pickCover = async () => {
    try {
      const picked = await open({
        multiple: false,
        filters: [{ name: "Картинка", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }],
      });
      if (!picked || Array.isArray(picked)) return;
      setBusy(true);
      const url = await api.setPlaylistCover(route.kind, picked);
      setOwnCover(url);
      setNotice("Обложка обновлена");
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

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

  const entries: MenuEntry[] = [
    {
      id: "rename",
      title: "Переименовать",
      onSelect: () => setRenaming(playlist.title),
    },
    {
      id: "cover",
      title: "Сменить обложку",
      onSelect: () => void pickCover(),
    },
  ];

  return (
    <div className="view scroll">
      <div className="page-head">
        <Cover
          className="page-head__cover"
          src={ownCover ?? playlist.cover}
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
            {playlist.isMine && (
              <button
                className="btn-ghost"
                title="Изменить плейлист"
                aria-label="Изменить плейлист"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenu({ x: rect.left, y: rect.bottom + 8 });
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                >
                  <path d="M4 20h4l10-10a2.8 2.8 0 10-4-4L4 16v4z" />
                  <path d="M13.5 6.5l4 4" />
                </svg>
                Изменить
              </button>
            )}
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
        menuExtra={
          playlist.isMine
            ? (track) => [
                {
                  id: "remove-from-playlist",
                  title: "Удалить из плейлиста",
                  danger: true,
                  icon: <IconTrash size={18} />,
                  onSelect: () => void removeTrack(track),
                },
              ]
            : undefined
        }
      />

      {menu && <Menu x={menu.x} y={menu.y} entries={entries} onClose={() => setMenu(null)} />}

      {renaming !== null && (
        <div className="modal" onPointerDown={(e) => e.target === e.currentTarget && setRenaming(null)}>
          <div className="modal__card">
            <button className="modal__close" onClick={() => setRenaming(null)} aria-label="Закрыть">
              ✕
            </button>
            <div className="modal__head">
              <h2 className="modal__title">Название плейлиста</h2>
              <div className="modal__sub">{playlist.title}</div>
            </div>
            <div className="modal__row">
              <input
                className="modal__input"
                value={renaming}
                autoFocus
                maxLength={100}
                onChange={(e) => setRenaming(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void applyRename();
                }}
              />
              <button className="btn-primary" disabled={busy} onClick={() => void applyRename()}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
