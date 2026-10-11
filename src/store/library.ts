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
      // Служебные плейлисты Яндекса («Плейлист дня» и т.п.) не нужны —
      // оставляем только то, что человек реально собирал сам.
      const useful = playlists.filter((p) => p.trackCount > 0);
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

  logout: async () => {
    await api.logout();
    set({ account: null, playlists: [], likedTracks: [], likedIds: new Set() });
  },

  clearError: () => set({ error: null }),
}));
