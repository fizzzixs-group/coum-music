/** Типы, зеркалящие DTO из Rust-бэкенда (src-tauri/src/ym/models.rs). */

export interface Track {
  id: string;
  /** id альбома: Яндекс адресует трек парой `{id}:{albumId}`. */
  albumId: string;
  title: string;
  artists: string;
  /** Исполнители с id — чтобы по имени можно было перейти в их треки. */
  artistList: ArtistRef[];
  album: string;
  durationMs: number;
  cover: string | null;
  available: boolean;
  liked: boolean;
  explicit: boolean;
}

export interface ArtistRef {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  title: string;
  artists: string;
  cover: string | null;
  trackCount: number;
  year: number | null;
}

export interface Artist {
  id: string;
  name: string;
  cover: string | null;
}

export interface Playlist {
  kind: number;
  uid: number;
  title: string;
  description: string | null;
  cover: string | null;
  trackCount: number;
  ownerName: string;
  isMine: boolean;
  /** Служебная подборка Яндекса — такие в списке не показываем. */
  generated: boolean;
}

export interface PlaylistDetail {
  playlist: Playlist;
  tracks: Track[];
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface WaveBatch {
  batchId: string | null;
  tracks: Track[];
}

export interface Account {
  uid: number;
  displayName: string;
  login: string;
  avatar: string | null;
  hasPlus: boolean;
}

export interface StreamInfo {
  url: string;
  codec: string;
  bitrate: number;
}

/** Строка текста песни. `time` — секунды от начала, если текст синхронный. */
export interface LyricsLine {
  time: number | null;
  text: string;
}

export interface Lyrics {
  synced: boolean;
  lines: LyricsLine[];
  /** Откуда взяли текст (Яндекс или LRCLIB) — показываем пользователю. */
  source?: string;
}

/** Что сейчас играет — от этого зависит, докупать ли треки станции. */
export type PlaybackSource =
  | { kind: "wave"; station: string; label: string }
  | { kind: "playlist"; uid: number; kind_: number; title: string }
  | { kind: "likes" }
  | { kind: "search"; title: string };

/** Ответ проверки обновлений. */
export interface UpdateInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  /** Список изменений из описания релиза на GitHub. */
  notes: string;
  url: string;
  publishedAt: string;
}

/** Станция «Моя волна». */
export const WAVE_STATION = "user:onyourwave";

/** Что за подбор сейчас играет — это показываем в шапке плеера. */
export function sourceLabel(source: PlaybackSource | null): string {
  if (!source) return "Ничего не играет";
  switch (source.kind) {
    case "wave":
      return source.label;
    case "playlist":
      return `Плейлист · ${source.title}`;
    case "likes":
      return "Мне нравится";
    case "search":
      return `Поиск · ${source.title}`;
  }
}

/** Играет ли сейчас именно станция, а не плейлист, избранное или поиск. */
export function isWaveSource(source: PlaybackSource | null): boolean {
  return source?.kind === "wave";
}

/** Станция «волна по треку»: Яндекс подбирает похожее на конкретный трек. */
export function trackStation(track: Track): string {
  return `track:${track.id}`;
}

/** Трек адресуется парой `{id}:{albumId}` — так его ждёт rotor. */
export function rotorId(track: Track): string {
  return track.albumId ? `${track.id}:${track.albumId}` : track.id;
}
