import { useEffect, useState } from "react";

import { api } from "@/api/backend";
import { Cover } from "@/components/Cover";
import { IconNote, IconPlus, IconRefresh, IconTrash } from "@/components/Icons";
import { Menu, type MenuEntry } from "@/components/Menu";
import { trackCount } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { useUi } from "@/store/ui";

type Picked = { uid: number; kind: number; title: string };

/** Вкладка со всеми плейлистами. По правому клику — переименовать или удалить. */
export function PlaylistsView() {
  const playlists = useLibrary((s) => s.playlists);
  const loading = useLibrary((s) => s.loadingPlaylists);
  const refresh = useLibrary((s) => s.refreshPlaylists);
  const rename = useLibrary((s) => s.renamePlaylist);
  const remove = useLibrary((s) => s.deletePlaylist);
  const go = useNav((s) => s.go);
  const openPlaylistPicker = useUi((s) => s.openPlaylistPicker);

  const [menu, setMenu] = useState<{ x: number; y: number; list: Picked } | null>(null);
  const [renaming, setRenaming] = useState<{ list: Picked; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Если у плейлиста нет своей обложки, показываем обложку первой песни —
  // карточка не выглядит пустым градиентом.
  const [covers, setCovers] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    // Своя обложка может быть даже там, где серверная уже есть:
    // поэтому проверяем все карточки, а не только «пустые».
    const missing = playlists.slice(0, 12);
    void Promise.all(
      missing.map(async (p) => {
        try {
          // Сначала своя обложка, потом серверная, потом первая песня.
          const own = await api.playlistCover(p.kind);
          if (!cancelled && own) {
            setCovers((prev) => ({ ...prev, [p.kind]: own }));
            return;
          }
          const detail = await api.playlist(p.uid, p.kind);
          const cover = detail.tracks.find((t) => t.cover)?.cover;
          if (!cancelled && cover) {
            setCovers((prev) => ({ ...prev, [p.kind]: cover }));
          }
        } catch {
          // нет доступа — останется градиент
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [playlists]);

  const confirmDelete = async (list: Picked) => {
    setBusy(true);
    setError(null);
    try {
      await remove(list.kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить плейлист");
    } finally {
      setBusy(false);
    }
  };

  const applyRename = async () => {
    if (!renaming) return;
    const title = renaming.value.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    try {
      await rename(renaming.list.kind, title);
      setRenaming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось переименовать");
    } finally {
      setBusy(false);
    }
  };

  const entries: MenuEntry[] = menu
    ? [
        {
          id: "open",
          title: "Открыть",
          icon: <IconNote size={18} />,
          onSelect: () =>
            go({
              name: "playlist",
              uid: menu.list.uid,
              kind: menu.list.kind,
              title: menu.list.title,
            }),
        },
        {
          id: "rename",
          title: "Переименовать",
          onSelect: () => setRenaming({ list: menu.list, value: menu.list.title }),
        },
        "sep",
        {
          id: "delete",
          title: "Удалить плейлист",
          sub: "исчезнет и в Яндекс.Музыке",
          danger: true,
          icon: <IconTrash size={18} />,
          onSelect: () => void confirmDelete(menu.list),
        },
      ]
    : [];

  return (
    <div className="view scroll">
      <div className="search-view">
        <h1 className="search-view__title">Плейлисты</h1>
        <p className="search-view__sub">
          {loading
            ? "Загружаю…"
            : playlists.length > 0
              ? `${playlists.length} шт. · правый клик по плейлисту — переименовать или удалить`
              : "Здесь появятся плейлисты из твоего аккаунта"}
        </p>

        <div className="view__actions">
          <button className="btn-primary" onClick={() => openPlaylistPicker(null)}>
            <IconPlus size={17} />
            Создать плейлист
          </button>
          {!loading && playlists.length > 0 && (
            <button className="btn-ghost" onClick={() => void refresh()}>
              <IconRefresh size={16} />
              Обновить
            </button>
          )}
        </div>

        {error && <div className="error-bar" style={{ marginTop: 14 }}>{error}</div>}

        {!loading && playlists.length === 0 && (
          <div className="empty">
            <IconNote size={22} />
            <div className="empty__title">Пока пусто</div>
            <p>Собери первый плейлист прямо здесь — или создай его в Яндекс.Музыке.</p>
          </div>
        )}

        {playlists.length > 0 && (
          <div className="card-grid" style={{ marginTop: 24 }}>
            {playlists.map((p) => (
              <button
                key={`${p.uid}:${p.kind}`}
                className="card"
                disabled={busy}
                onClick={() => go({ name: "playlist", uid: p.uid, kind: p.kind, title: p.title })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    list: { uid: p.uid, kind: p.kind, title: p.title },
                  });
                }}
              >
                <Cover className="card__cover" src={covers[p.kind] ?? p.cover ?? null} seed={`${p.uid}:${p.kind}`} alt="" />
                <div className="card__title">{p.title}</div>
                <div className="card__sub">
                  {p.trackCount > 0 ? trackCount(p.trackCount) : "пустой"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {menu && <Menu x={menu.x} y={menu.y} entries={entries} onClose={() => setMenu(null)} />}

      {renaming && (
        <div
          className="modal"
          onPointerDown={(e) => e.target === e.currentTarget && setRenaming(null)}
        >
          <div className="modal__card">
            <button
              className="modal__close"
              onClick={() => setRenaming(null)}
              aria-label="Закрыть"
            >
              ✕
            </button>
            <div className="modal__head">
              <h2 className="modal__title">Переименовать</h2>
              <div className="modal__sub">{renaming.list.title}</div>
            </div>
            <div className="modal__row">
              <input
                className="modal__input"
                value={renaming.value}
                autoFocus
                maxLength={100}
                onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
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
