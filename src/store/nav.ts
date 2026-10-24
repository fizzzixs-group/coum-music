/** Навигация: какой экран открыт. */

import { create } from "zustand";

export type Route =
  | { name: "wave" }
  | { name: "search" }
  | { name: "playlists" }
  | { name: "likes" }
  | { name: "settings" }
  | { name: "artist"; id: string; title: string }
  | { name: "album"; id: string; title: string }
  | { name: "playlist"; uid: number; kind: number; title: string };

type NavState = {
  route: Route;
  searchQuery: string;
  go: (route: Route) => void;
  setSearchQuery: (q: string) => void;
};

export const useNav = create<NavState>()((set) => ({
  route: { name: "wave" },
  searchQuery: "",
  go: (route) => set({ route }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
