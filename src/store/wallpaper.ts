/** Свой фон приложения: картинка, GIF или видео из файла на устройстве. */

import { create } from "zustand";

import { api } from "@/api/backend";

const DIM_KEY = "coum.wall.dim";
const DEFAULT_DIM = 0.5;

/** Адрес файла фона отдаёт локальный прокси (см. src-tauri/src/stream_proxy.rs). */
const BASE_URL = "http://coumstream.localhost/wallpaper";

const VIDEO_EXT = ["mp4", "webm"];

function isVideoPath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT.includes(ext);
}

type WallpaperState = {
  /** Путь к копии файла в настройках приложения (его отдаёт прокси). */
  path: string | null;
  isVideo: boolean;
  /** Насколько сильно затемнять фон: 0 — видно как есть, 1 — полностью скрыт. */
  dim: number;
  /** Меняется при каждой смене файла: сбрасывает кэш картинки в вебвью. */
  version: number;
  ready: boolean;

  init: () => Promise<void>;
  choose: (path: string) => Promise<void>;
  clear: () => Promise<void>;
  setDim: (value: number) => void;
  /** Готовый адрес картинки/видео для тега. */
  src: () => string | null;
};

export const useWallpaper = create<WallpaperState>()((set, get) => ({
  path: null,
  isVideo: false,
  dim: Number(localStorage.getItem(DIM_KEY) ?? DEFAULT_DIM),
  version: Date.now(),
  ready: false,

  init: async () => {
    try {
      const path = await api.wallpaper();
      set({
        path,
        isVideo: path ? isVideoPath(path) : false,
        version: Date.now(),
        ready: true,
      });
    } catch {
      set({ ready: true });
    }
  },

  choose: async (path) => {
    const saved = await api.setWallpaper(path);
    set({ path: saved, isVideo: isVideoPath(saved), version: Date.now() });
  },

  clear: async () => {
    await api.clearWallpaper();
    set({ path: null, isVideo: false });
  },

  setDim: (value) => {
    const dim = Math.min(Math.max(value, 0), 1);
    localStorage.setItem(DIM_KEY, String(dim));
    set({ dim });
  },

  src: () => {
    const { path, version } = get();
    return path ? `${BASE_URL}?v=${version}` : null;
  },
}));
