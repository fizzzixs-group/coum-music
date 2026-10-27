import { useEffect } from "react";

import { events } from "@/api/backend";
import { BottomNav } from "@/components/BottomNav";
import { PlayerBar } from "@/components/PlayerBar";
import { PlaylistDialog } from "@/components/PlaylistDialog";
import { Sidebar } from "@/components/Sidebar";
import { TitleBar } from "@/components/TitleBar";
import { useIsMobile } from "@/lib/platform";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { currentTrack, usePlayer } from "@/store/player";
import { useUi } from "@/store/ui";
import { ArtistView } from "@/views/ArtistView";
import { AlbumView } from "@/views/AlbumView";
import { LikesView } from "@/views/LikesView";
import { LoginView } from "@/views/LoginView";
import { PlaylistView } from "@/views/PlaylistView";
import { PlaylistsView } from "@/views/PlaylistsView";
import { SearchView } from "@/views/SearchView";
import { SettingsView } from "@/views/SettingsView";
import { WaveView } from "@/views/WaveView";

export default function App() {
  const account = useLibrary((s) => s.account);
  const authChecked = useLibrary((s) => s.authChecked);
  const init = useLibrary((s) => s.init);
  const applyAccount = useLibrary((s) => s.applyAccount);
  const route = useNav((s) => s.route);
  const error = usePlayer((s) => s.error);
  const setError = usePlayer((s) => s.setError);
  const track = usePlayer(currentTrack);
  const notice = usePlayer((s) => s.notice);
  const setNotice = usePlayer((s) => s.setNotice);
  const playlistPicker = useUi((s) => s.playlistPicker);
  const closePlaylistPicker = useUi((s) => s.closePlaylistPicker);
  // На телефоне интерфейс другой: навигация внизу, окно без своей шапки.
  const mobile = useIsMobile();
  // Хэллоуинский декор включается вместе с темой.

  // Мягкое уведомление само исчезает — оно не должно мешать слушать.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  // Перешли в другой раздел — окно выбора плейлиста закрываем, чтобы оно
  // не висело поверх новой вкладки.
  useEffect(() => {
    closePlaylistPicker();
  }, [route, closePlaylistPicker]);

  useEffect(() => {
    void init();

    const unlisten: Array<() => void> = [];
    void events.onAuthSuccess((acc) => void applyAccount(acc)).then((fn) => unlisten.push(fn));
    void events.onAuthError((message) => setError(message)).then((fn) => unlisten.push(fn));

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (typing) return;

      const player = usePlayer.getState();
      if (e.code === "Space") {
        e.preventDefault();
        player.toggle();
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        player.next();
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        player.prev();
      } else if (e.key === "ArrowRight") {
        player.seek(player.position + 5);
      } else if (e.key === "ArrowLeft") {
        player.seek(Math.max(0, player.position - 5));
      }
    };

    window.addEventListener("keydown", onKey);

    // Своё меню у нас есть только там, где оно нужно (треки, очереди).
    // Везде остальное системное меню браузера с «Назад / Обновить / Печать»
    // в приложении выглядит чужеродно — убираем его глобально.
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", blockContextMenu);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", blockContextMenu);
      unlisten.forEach((fn) => fn());
    };
  }, [init, applyAccount, setError]);

  const renderView = () => {
    if (!authChecked) {
      return (
        <div className="loading">
          <div className="spinner" />
          Проверяю сессию…
        </div>
      );
    }
    if (!account) return <LoginView />;

    switch (route.name) {
      case "wave":
        return <WaveView />;
      case "artist":
        return <ArtistView route={route} />;
      case "album":
        return <AlbumView route={route} />;
      case "search":
        return <SearchView />;
      case "playlists":
        return <PlaylistsView />;
      case "likes":
        return <LikesView />;
      case "settings":
        return <SettingsView />;
      case "playlist":
        return <PlaylistView route={route} />;
    }
  };

  return (
    <div className="app" data-mobile={mobile}>
      {/* Свечение по цвету обложки — на всё окно, включая сайдбар и шапку:
          иначе видно резкую границу области контента. */}
      {route.name === "wave" && track?.cover && (
        <div className="app__glow" aria-hidden>
          {/* key: смена обложки создаёт новый элемент, и он проявляется
              плавно, а не вспыхивает сразу. */}
          <img key={track.cover} src={track.cover} alt="" />
          <div className="app__glow-veil" />
        </div>
      )}


      <TitleBar />

      <div className="body">
        {!mobile && account && <Sidebar />}
        <main className="main">
          {error && (
            <div className="error-bar" role="alert">
              <span style={{ flex: 1 }}>{error}</span>
              <button className="win-btn" onClick={() => setError(null)} aria-label="Скрыть">
                ✕
              </button>
            </div>
          )}
          {renderView()}
          {notice && <div className="toast">{notice}</div>}
        </main>
      </div>

      {/* Плеер и навигация имеют смысл только после входа: на экране входа
          они перекрывали карточку входа. */}
      {account && route.name !== "wave" && <PlayerBar />}
      {account && mobile && <BottomNav />}

      {/* Диалог плейлистов живёт здесь: меню трека закрывается сразу после
          клика, поэтому открывать окно из него нельзя. */}
      {playlistPicker && (
        <PlaylistDialog track={playlistPicker.track} onClose={closePlaylistPicker} />
      )}
    </div>
  );
}
