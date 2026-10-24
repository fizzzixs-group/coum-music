import { useEffect, useState } from "react";

import { api, humanError } from "@/api/backend";
import type { Track } from "@/api/types";
import { Cover } from "@/components/Cover";
import { IconCheck, IconNote, IconPlus } from "@/components/Icons";
import { useLibrary } from "@/store/library";

type Props = {
  /** Если передан трек — режим «добавить в плейлист», иначе просто создание. */
  track?: Track | null;
  onClose: () => void;
};

/**
 * Один диалог на два случая: создать плейлист и положить в него трек.
 * Плейлисты, где трек уже есть, помечаются — повторно туда не добавить.
 */
export function PlaylistDialog({ track, onClose }: Props) {
  const playlists = useLibrary((s) => s.playlists);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);

  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Где трек уже лежит: kind плейлиста → набор id треков.
  const [membership, setMembership] = useState<Record<number, Set<string>>>({});
  const [checking, setChecking] = useState(Boolean(track));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Смотрим составы плейлистов по очереди: параллельные запросы Яндекс ловит
  // лимитом. Плейлистов у человека обычно немного.
  useEffect(() => {
    if (!track) {
      setChecking(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const found: Record<number, Set<string>> = {};
      for (const playlist of playlists) {
        if (cancelled) return;
        try {
          const detail = await api.playlist(playlist.uid, playlist.kind);
          found[playlist.kind] = new Set(detail.tracks.map((t) => t.id));
        } catch {
          // Не смогли прочитать состав — считаем, что трека там нет.
          found[playlist.kind] = new Set();
        }
      }
      if (!cancelled) {
        setMembership(found);
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [track, playlists]);

  const markAdded = (kind: number) => {
    if (!track) return;
    setMembership((prev) => {
      const next = { ...prev };
      next[kind] = new Set(prev[kind] ?? []).add(track.id);
      return next;
    });
  };

  const create = async (alsoAdd: boolean) => {
    if (!title.trim()) {
      setError("Введите название");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const playlist = await createPlaylist(title.trim(), isPrivate);
      if (alsoAdd && track) {
        await addToPlaylist(playlist.kind, track);
        markAdded(playlist.kind);
        setDone(`«${track.title}» добавлен в «${playlist.title}»`);
      } else {
        setDone(`Плейлист «${playlist.title}» создан`);
      }
      setTimeout(onClose, 1000);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const pick = async (kind: number, name: string) => {
    if (!track) return;
    if (membership[kind]?.has(track.id)) return;

    setBusy(true);
    setError(null);
    try {
      await addToPlaylist(kind, track);
      markAdded(kind);
      setDone(`«${track.title}» добавлен в «${name}»`);
      setTimeout(onClose, 1000);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__card" role="dialog" aria-label="Плейлисты">
        <button className="modal__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <div className="modal__head">
          <h2 className="modal__title">{track ? "Добавить в плейлист" : "Новый плейлист"}</h2>
          {track && <div className="modal__sub">{track.title}</div>}
        </div>

        {done ? (
          <div className="modal__done">
            <IconCheck size={20} />
            {done}
          </div>
        ) : (
          <>
            <div className="modal__row">
              <input
                className="modal__input"
                placeholder="Название плейлиста"
                value={title}
                autoFocus
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void create(Boolean(track));
                }}
              />
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => void create(Boolean(track))}
              >
                {busy ? "Сохраняю…" : track ? "Создать и добавить" : "Создать"}
              </button>
            </div>

            <label className="modal__check">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Приватный — виден только мне
            </label>

            {error && <div className="login__error">{error}</div>}

            {track && playlists.length > 0 && (
              <>
                <div className="modal__sep">или выбери существующий</div>
                <div className="modal__list scroll">
                  {playlists.map((p) => {
                    const already = membership[p.kind]?.has(track.id) ?? false;
                    return (
                      <button
                        key={p.kind}
                        className="modal__playlist"
                        data-already={already}
                        disabled={busy || already || checking}
                        onClick={() => void pick(p.kind, p.title)}
                        title={already ? "Трек уже в этом плейлисте" : `Добавить в «${p.title}»`}
                      >
                        <Cover
                          className="modal__cover"
                          src={p.cover}
                          seed={String(p.kind)}
                          alt=""
                        />
                        <span className="modal__playlist-text">
                          <span className="modal__playlist-name">{p.title}</span>
                          <span className="modal__playlist-count">
                            {already
                              ? "трек уже здесь"
                              : checking
                                ? "проверяю…"
                                : p.trackCount > 0
                                  ? `${p.trackCount} треков`
                                  : "пустой"}
                          </span>
                        </span>
                        {already ? <IconCheck size={18} /> : <IconPlus size={18} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {!track && (
              <div className="modal__hint">
                <IconNote size={15} />
                Плейлист появится в Яндекс.Музыке и в этом приложении.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
