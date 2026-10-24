/** Состояние интерфейса: диалоги, которые можно открыть из любого места. */

import { create } from "zustand";

import type { Track } from "@/api/types";

type UiState = {
  /** Открыт ли выбор плейлиста. `track: null` — просто создание плейлиста. */
  playlistPicker: { track: Track | null } | null;
  openPlaylistPicker: (track: Track | null) => void;
  closePlaylistPicker: () => void;
};

/**
 * Диалог живёт здесь, а не в меню трека: меню закрывается сразу после клика
 * и уносит с собой локальное состояние, из-за чего окно просто не появлялось.
 */
export const useUi = create<UiState>()((set) => ({
  playlistPicker: null,
  openPlaylistPicker: (track) => set({ playlistPicker: { track } }),
  closePlaylistPicker: () => set({ playlistPicker: null }),
}));
