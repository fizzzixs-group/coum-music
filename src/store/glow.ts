/** Подсветка фона под цвет обложки. */

import { create } from "zustand";

const KEY = "coum.glow";

function apply(value: boolean): void {
  document.documentElement.dataset.glow = value ? "on" : "off";
}

const initial = localStorage.getItem(KEY) !== "0";

type Store = { glow: boolean; setGlow: (value: boolean) => void };

export const useGlow = create<Store>()((set) => ({
  glow: initial,
  setGlow: (value) => {
    localStorage.setItem(KEY, value ? "1" : "0");
    apply(value);
    set({ glow: value });
  },
}));

if (typeof document !== "undefined") apply(initial);
