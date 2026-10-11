import { Cover } from "@/components/Cover";
import { IconNote, IconRefresh } from "@/components/Icons";
import { trackCount } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";

/** Отдельная вкладка со всеми плейлистами аккаунта. */
export function PlaylistsView() {
  const playlists = useLibrary((s) => s.playlists);
  const loading = useLibrary((s) => s.loadingPlaylists);
  const refresh = useLibrary((s) => s.refreshPlaylists);
  const go = useNav((s) => s.go);

  return (
    <div className="view scroll">
      <div className="search-view">
        <h1 className="search-view__title">Плейлисты</h1>
        <p className="search-view__sub">
          {loading
            ? "Загружаю…"
            : playlists.length > 0
              ? `${playlists.length} шт. — всё, что ты собрал в Яндекс.Музыке`
              : "Здесь появятся плейлисты из твоего аккаунта"}
        </p>

        {!loading && playlists.length > 0 && (
          <button className="btn-ghost" onClick={() => void refresh()}>
            <IconRefresh size={16} />
            Обновить
          </button>
        )}

        {loading && playlists.length === 0 && (
          <div className="card-grid" style={{ marginTop: 24 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: "1 / 1.2" }} />
            ))}
          </div>
        )}

        {!loading && playlists.length === 0 && (
          <div className="empty">
            <IconNote size={22} />
            <div className="empty__title">Пока пусто</div>
            <p>Создай плейлист в Яндекс.Музыке — он появится здесь.</p>
          </div>
        )}

        {playlists.length > 0 && (
          <div className="card-grid" style={{ marginTop: 24 }}>
            {playlists.map((p) => (
              <button
                key={`${p.uid}:${p.kind}`}
                className="card"
                onClick={() => go({ name: "playlist", uid: p.uid, kind: p.kind, title: p.title })}
              >
                <Cover className="card__cover" src={p.cover} seed={`${p.uid}:${p.kind}`} alt="" />
                <div className="card__title">{p.title}</div>
                <div className="card__sub">{trackCount(p.trackCount)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
