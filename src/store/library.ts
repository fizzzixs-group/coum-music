/** Библиотека: аккаунт, плейлисты, лайки. */

import { create } from "zustand";

import { api, humanError } from "@/api/backend";
import type { Account, Playlist, Track } from "@/api/types";

type LibraryState = {
  account: Account | null;
  authChecked: boolean;
  playlists: Playlist[];
  likedTracks: Track[];
  likedIds: Set<string>;
  loadingPlaylists: boolean;
  loadingLiked: boolean;
  error: string | null;

  init: () => Promise<void>;
  applyAccount: (account: Account) => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  loadLiked: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (trackId: string) => boolean;
  createPlaylist: (title: string, isPrivate: boolean) => Promise<Playlist>;
  addToPlaylist: (kind: number, track: Track) => Promise<void>;
  renamePlaylist: (kind: number, title: string) => Promise<void>;
  deletePlaylist: (kind: number) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useLibrary = create<LibraryState>()((set, get) => ({
  account: null,
  authChecked: false,
  playlists: [],
  likedTracks: [],
  likedIds: new Set<string>(),
  loadingPlaylists: false,
  loadingLiked: false,
  error: null,

  init: async () => {
    try {
      const account = await api.account();
      set({ account, authChecked: true });
      if (account) {
        await get().refreshPlaylists();
        void get().loadLiked();
      }
    } catch (e) {
      set({ authChecked: true, error: humanError(e) });
    }
  },

  applyAccount: async (account) => {
    set({ account, error: null });
    await get().refreshPlaylists();
    void get().loadLiked();
  },

  refreshPlaylists: async () => {
    if (!get().account) return;
    set({ loadingPlaylists: true });
    try {
      const playlists = await api.playlists();
      // Служебные подборки Яндекса («Плейлист дня», «Дежавю») не нужны, а вот
      // пустые свои плейлисты показывать обязательно — иначе только что
      // созданный просто не появится в списке.
      const useful = playlists.filter((p) => !p.generated);
      set({ playlists: useful, loadingPlaylists: false });
    } catch (e) {
      set({ loadingPlaylists: false, error: humanError(e) });
    }
  },

  loadLiked: async () => {
    if (!get().account) return;
    set({ loadingLiked: true });
    try {
      const likedTracks = await api.liked();
      set({
        likedTracks,
        likedIds: new Set(likedTracks.map((t) => t.id)),
        loadingLiked: false,
      });
    } catch (e) {
      set({ loadingLiked: false, error: humanError(e) });
    }
  },

  toggleLike: async (track) => {
    const liked = get().likedIds.has(track.id);
    const next = new Set(get().likedIds);
    if (liked) next.delete(track.id);
    else next.add(track.id);

    set({
      likedIds: next,
      likedTracks: liked
        ? get().likedTracks.filter((t) => t.id !== track.id)
        : [{ ...track, liked: true }, ...get().likedTracks],
    });

    try {
      await api.setLike(track.id, !liked);
    } catch (e) {
      // Откатываем оптимистичное изменение, если API отказал.
      const rollback = new Set(get().likedIds);
      if (liked) rollback.add(track.id);
      else rollback.delete(track.id);
      set({ likedIds: rollback, error: humanError(e) });
    }
  },

  isLiked: (trackId) => get().likedIds.has(trackId),

  createPlaylist: async (title, isPrivate) => {
    const playlist = await api.createPlaylist(title, isPrivate);
    // Показываем сразу, не дожидаясь повторной выборки списка с сервера.
    set({ playlists: [playlist, ...get().playlists], error: null });
    void get().refreshPlaylists();
    return playlist;
  },

  renamePlaylist: async (kind, title) => {
    await api.playlistRename(kind, title);
    set({
      playlists: get().playlists.map((p) => (p.kind === kind ? { ...p, title } : p)),
    });
  },

  deletePlaylist: async (kind) => {
    await api.playlistDelete(kind);
    // Убираем из списка сразу, чтобы не ждать повторной загрузки.
    set({ playlists: get().playlists.filter((p) => p.kind !== kind) });
  },

  addToPlaylist: async (kind, track) => {
    try {
      await api.playlistAddTrack(kind, track.id, track.albumId ?? null);
      void get().refreshPlaylists();
    } catch (e) {
      set({ error: humanError(e) });
      throw e;
    }
  },

  logout: async () => {
    await api.logout();
    set({ account: null, playlists: [], likedTracks: [], likedIds: new Set() });
  },

  clearError: () => set({ error: null }),
}));
