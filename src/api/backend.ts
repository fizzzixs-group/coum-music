/** Тонкая обёртка над Tauri IPC. Все сетевые вызовы живут в Rust. */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  Account,
  Artist,
  Lyrics,
  Playlist,
  PlaylistDetail,
  SearchResult,
  StreamInfo,
  Track,
  UpdateInfo,
  WaveBatch,
} from "./types";

export const api = {
  account: () => invoke<Account | null>("account"),
  login: () => invoke<void>("login"),
  loginWithToken: (token: string) => invoke<Account>("login_with_token", { token }),
  logout: () => invoke<void>("logout"),

  playlists: () => invoke<Playlist[]>("playlists"),
  playlist: (uid: number, kind: number) => invoke<PlaylistDetail>("playlist", { uid, kind }),

  search: (query: string, page = 0) => invoke<SearchResult>("search", { query, page }),

  liked: () => invoke<Track[]>("liked"),
  artistTracks: (artistId: string, page = 0) =>
    invoke<Track[]>("artist_tracks", { artistId, page }),
  /** Карточка исполнителя: имя и аватар. */
  artist: (artistId: string) => invoke<Artist>("artist", { artistId }),
  /** Все треки альбома. */
  albumTracks: (albumId: string) => invoke<Track[]>("album_tracks", { albumId }),
  setLike: (trackId: string, like: boolean) => invoke<void>("set_like", { trackId, like }),

  wave: (station?: string, queue?: string) =>
    invoke<WaveBatch>("wave", { station: station ?? null, queue: queue ?? null }),
  waveFeedback: (
    station: string,
    kind: "trackStarted" | "trackFinished" | "skip",
    trackId: string,
    batchId?: string | null,
    playedSeconds?: number,
  ) =>
    invoke<void>("wave_feedback", {
      station,
      kind,
      trackId,
      batchId: batchId ?? null,
      playedSeconds: playedSeconds ?? null,
    }),

  stream: (trackId: string) => invoke<StreamInfo>("stream", { trackId }),

  lyrics: (track: Track) =>
    invoke<Lyrics | null>("lyrics", {
      trackId: track.id,
      title: track.title,
      artist: track.artists,
      album: track.album,
      duration: track.durationMs / 1000,
    }),

  /** Открывает ссылку в системном браузере (Telegram и т.п.). */
  openExternal: (url: string) => invoke<void>("open_external", { url }),

  /** Фон приложения: копируем выбранный файл в настройки и отдаём его прокси. */
  wallpaper: () => invoke<string | null>("wallpaper"),
  setWallpaper: (path: string) => invoke<string>("set_wallpaper", { path }),
  clearWallpaper: () => invoke<void>("clear_wallpaper"),

  /** Проверка новой версии на GitHub. */
  checkUpdate: () => invoke<UpdateInfo>("check_update"),

  /** Создать свой плейлист прямо в приложении. */
  createPlaylist: (title: string, isPrivate: boolean) =>
    invoke<Playlist>("create_playlist", { title, private: isPrivate }),
  /** Положить трек в плейлист. */
  playlistAddTrack: (kind: number, trackId: string, albumId: string | null) =>
    invoke<void>("playlist_add_track", { kind, trackId, albumId }),
  /** Переименовать плейлист. */
  playlistRename: (kind: number, title: string) =>
    invoke<void>("playlist_rename", { kind, title }),
  /** Сделать плейлист приватным или публичным. */
  playlistSetVisibility: (kind: number, private_: boolean) =>
    invoke<void>("playlist_set_visibility", { kind, private: private_ }),
  /** Свой фон: картинка из файла (data-url). */
  setBackground: (path: string) => invoke<string>("set_background", { path }),
  /** Сохранённый фон, если он был. */
  background: () => invoke<string | null>("background"),
  /** Убрать фон. */
  clearBackground: () => invoke<void>("clear_background"),
  /** Уже сохранённая обложка плейлиста, если её ставили. */
  playlistCover: (kind: number) => invoke<string | null>("playlist_cover", { kind }),
  /** Своя обложка плейлиста (возвращает data-url). */
  setPlaylistCover: (kind: number, path: string) =>
    invoke<string>("set_playlist_cover", { kind, path }),
  /** Удалить плейлист целиком. */
  playlistDelete: (kind: number) => invoke<void>("playlist_delete", { kind }),
  /** Убрать трек из плейлиста. */
  playlistRemoveTrack: (kind: number, trackId: string) =>
    invoke<void>("playlist_remove_track", { kind, trackId }),
};

export const events = {
  onAuthSuccess: (cb: (account: Account) => void): Promise<UnlistenFn> =>
    listen<Account>("auth://success", (e) => cb(e.payload)),
  onAuthError: (cb: (message: string) => void): Promise<UnlistenFn> =>
    listen<string>("auth://error", (e) => cb(e.payload)),
};

/** Приводит любую ошибку IPC к человекочитаемой строке. */
export function humanError(e: unknown): string {
  const raw = typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
  if (/unauthorized|токен не принят/i.test(raw)) return "Сессия истекла — войди заново";
  if (/network|сеть|dns|connect/i.test(raw)) return "Нет связи с Яндекс.Музыкой";
  if (/TrackUnavailable|недоступен/i.test(raw)) return "Этот трек недоступен для воспроизведения";
  return raw;
}
