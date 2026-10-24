/** Очередь воспроизведения, станции (Моя волна / волна по треку) и звук. */

import { create } from "zustand";

import { api, humanError } from "@/api/backend";
import { rotorId, trackStation, WAVE_STATION } from "@/api/types";
import type { PlaybackSource, Track } from "@/api/types";
import { engine } from "@/audio/engine";
import { useLibrary } from "./library";

/** Сколько треков остаётся до дозагрузки станции. */
const REFILL_THRESHOLD = 4;
/** Подписанные ссылки живут ограниченное время — держим их в кэше недолго. */
const STREAM_TTL_MS = 20 * 60 * 1000;
/** Сколько треков подряд можно молча пропустить, если они не играются. */
const MAX_AUTO_SKIP = 3;

const streamCache = new Map<string, { url: string; at: number }>();

/** Счётчик автопропусков: сбрасывается, как только трек заиграл. */
let autoSkips = 0;

/** Трек не отдаётся: истёк, недоступен в регионе, лимит запросов и т.п. */
function looksUnavailable(message: string): boolean {
  return /недоступ|Concurrency|429|CDN ответил|сеть недоступна|502|503/i.test(message);
}

type SeedContinuation = { station: string; label: string };

type PlayerState = {
  queue: Track[];
  index: number;
  source: PlaybackSource | null;
  batchId: string | null;
  /** Режим «сначала этот трек, потом волна по нему». */
  seedContinuation: SeedContinuation | null;
  playing: boolean;
  buffering: boolean;
  loading: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  error: string | null;
  /** Мягкое уведомление — например «трек недоступен, пропускаю». */
  notice: string | null;
  streamCodec: string | null;

  playTracks: (tracks: Track[], startIndex: number, source: PlaybackSource | null) => Promise<void>;
  startWave: (station?: string, label?: string) => Promise<void>;
  seedWaveFromTrack: (track: Track) => Promise<void>;
  refillWave: () => Promise<void>;
  enqueue: (track: Track) => void;
  playAt: (index: number) => Promise<void>;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleLike: () => Promise<void>;
  setError: (message: string | null) => void;
  setNotice: (message: string | null) => void;
};

/** Обратная связь станции — от неё зависит, что она подберёт дальше. */
async function waveFeedback(
  kind: "trackStarted" | "trackFinished" | "skip",
  track: Track,
  playedSeconds?: number,
): Promise<void> {
  const state = usePlayer.getState();
  // Пока играет одиночный трек-затравка, станция ещё не запущена.
  if (state.source?.kind !== "wave" || state.seedContinuation) return;

  try {
    await api.waveFeedback(state.source.station, kind, rotorId(track), state.batchId, playedSeconds);
  } catch {
    // Фидбек не критичен: без него станция просто продолжит по своим правилам.
  }
}

async function resolveStream(track: Track): Promise<{ url: string; codec: string }> {
  const cached = streamCache.get(track.id);
  if (cached && Date.now() - cached.at < STREAM_TTL_MS) {
    return { url: cached.url, codec: "" };
  }
  const info = await api.stream(track.id);
  streamCache.set(track.id, { url: info.url, at: Date.now() });
  return { url: info.url, codec: info.codec };
}

async function onTrackEnded(): Promise<void> {
  const { queue, index, seedContinuation } = usePlayer.getState();
  const track = queue[index];
  if (track) await waveFeedback("trackFinished", track, track.durationMs / 1000);

  if (seedContinuation) {
    await usePlayer.getState().startWave(seedContinuation.station, seedContinuation.label);
    return;
  }

  if (index < queue.length - 1) {
    await usePlayer.getState().playAt(index + 1);
    return;
  }

  if (usePlayer.getState().source?.kind === "wave") {
    await usePlayer.getState().refillWave();
    const next = usePlayer.getState();
    if (next.queue.length > index + 1) await next.playAt(index + 1);
  } else {
    usePlayer.setState({ playing: false });
  }
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  queue: [],
  index: 0,
  source: null,
  batchId: null,
  seedContinuation: null,
  playing: false,
  buffering: false,
  loading: false,
  position: 0,
  duration: 0,
  volume: Number(localStorage.getItem("coum.volume") ?? "0.8"),
  muted: localStorage.getItem("coum.muted") === "1",
  error: null,
  notice: null,
  streamCodec: null,

  playTracks: async (tracks, startIndex, source) => {
    if (tracks.length === 0) return;
    set({
      queue: tracks,
      index: Math.min(Math.max(startIndex, 0), tracks.length - 1),
      source,
      batchId: null,
      seedContinuation: null,
      error: null,
      position: 0,
      duration: 0,
    });
    await get().playAt(get().index);
  },

  startWave: async (station = WAVE_STATION, label = "Моя волна") => {
    set({ loading: true, error: null, seedContinuation: null });
    try {
      const batch = await api.wave(station);
      if (batch.tracks.length === 0) {
        set({ loading: false });
        return;
      }
      set({
        queue: batch.tracks,
        index: 0,
        source: { kind: "wave", station, label },
        batchId: batch.batchId,
      });
      await get().playAt(0);
    } catch (e) {
      set({ loading: false, error: humanError(e) });
    }
  },

  /** Сначала играет выбранный трек целиком, потом включается станция по нему. */
  seedWaveFromTrack: async (track) => {
    const station = trackStation(track);
    const label = `Волна по треку · ${track.title}`;
    const state = get();
    const current = state.queue[state.index];

    // Трек уже играет — не перезапускаем: человек нажал «волну по треку»,
    // а не «играть сначала». Станция подхватится, когда трек доиграет,
    // поэтому склейки на слух не слышно.
    if (current && current.id === track.id) {
      set({
        source: { kind: "wave", station, label },
        seedContinuation: { station, label },
        batchId: null,
        error: null,
      });
      return;
    }

    set({
      queue: [track],
      index: 0,
      source: { kind: "wave", station, label },
      batchId: null,
      seedContinuation: { station, label },
      error: null,
      position: 0,
      duration: 0,
    });
    await get().playAt(0);
  },

  refillWave: async () => {
    const { queue, batchId, source, seedContinuation } = get();
    if (source?.kind !== "wave" || seedContinuation) return;
    try {
      // Передаём id последнего трека: так станция отдаёт продолжение цепочки,
      // а не тот же самый список заново.
      const last = queue[queue.length - 1];
      const batch = await api.wave(source.station, last ? rotorId(last) : undefined);
      const known = new Set(queue.map((t) => t.id));
      const fresh = batch.tracks.filter((t) => !known.has(t.id));
      set({
        queue: fresh.length > 0 ? [...queue, ...fresh] : queue,
        batchId: batch.batchId ?? batchId,
      });
    } catch (e) {
      set({ error: humanError(e) });
    }
  },

  enqueue: (track) => {
    const { queue } = get();
    if (queue.some((t) => t.id === track.id)) return;
    set({ queue: [...queue, track] });
  },

  playAt: async (index) => {
    const { queue } = get();
    const track = queue[index];
    if (!track) return;

    set({ index, loading: true, error: null, position: 0, duration: track.durationMs });
    await waveFeedback("trackStarted", track);

    try {
      const stream = await resolveStream(track);
      set({ streamCodec: stream.codec });
      await engine.playUrl(stream.url);
      autoSkips = 0;
      set({ loading: false });

      const state = get();
      // Предзагрузку следующего трека запускаем ближе к концу текущего:
      // у Яндекса узкое окно по частоте запросов, и если готовить трек сразу,
      // старт и предзагрузка попадают в один интервал — прилетает 429.
      const upcoming = state.queue[index + 1];
      if (upcoming) {
        const left = Math.max(0, (state.duration || track.durationMs / 1000) - 20);
        const delay = Math.min(Math.max(left * 1000, 4000), 120_000);
        setTimeout(() => {
          void resolveStream(upcoming).catch(() => {});
        }, delay);
      }

      if (
        state.source?.kind === "wave" &&
        !state.seedContinuation &&
        state.queue.length - index <= REFILL_THRESHOLD
      ) {
        void get().refillWave();
      }
    } catch (e) {
      const message = humanError(e);
      const hasNext = index < get().queue.length - 1;

      // Недоступный трек — не повод показывать ошибку: молча идём дальше
      // и говорим об этом одной строкой.
      if (looksUnavailable(message) && hasNext && autoSkips < MAX_AUTO_SKIP) {
        autoSkips++;
        set({
          loading: false,
          error: null,
          notice: `«${track.title}» не отдаётся — пропускаю`,
        });
        void get().playAt(index + 1);
        return;
      }

      autoSkips = 0;
      set({ loading: false, error: message, playing: false });
    }
  },

  toggle: () => {
    const { queue, playing, source } = get();
    if (queue.length === 0) {
      if (source?.kind === "wave" || source === null) void get().startWave();
      return;
    }
    if (playing) engine.pause();
    else void engine.resume();
  },

  next: () => {
    const { queue, index, seedContinuation } = get();
    const track = queue[index];

    if (seedContinuation) {
      if (track) void waveFeedback("skip", track, engine.position);
      void get().startWave(seedContinuation.station, seedContinuation.label);
      return;
    }

    if (track) void waveFeedback("skip", track, engine.position);

    if (index < queue.length - 1) {
      void get().playAt(index + 1);
    } else if (get().source?.kind === "wave") {
      void get()
        .refillWave()
        .then(() => {
          const s = get();
          if (s.queue.length > s.index + 1) void s.playAt(s.index + 1);
        });
    }
  },

  prev: () => {
    const { index } = get();
    if (engine.position > 4) {
      engine.seek(0);
      return;
    }
    if (index > 0) void get().playAt(index - 1);
  },

  seek: (seconds) => {
    engine.seek(seconds);
    set({ position: seconds });
  },

  setVolume: (value) => {
    const volume = Math.min(Math.max(value, 0), 1);
    localStorage.setItem("coum.volume", String(volume));
    localStorage.setItem("coum.muted", "0");
    set({ volume, muted: false });
    engine.setVolume(volume, false);
  },

  toggleMute: () => {
    const muted = !get().muted;
    localStorage.setItem("coum.muted", muted ? "1" : "0");
    set({ muted });
    engine.setVolume(get().volume, muted);
  },

  toggleLike: async () => {
    const { queue, index } = get();
    const track = queue[index];
    if (!track) return;
    // Лайк уходит в общий API лайков — rotor читает его оттуда.
    await useLibrary.getState().toggleLike(track);
  },

  setError: (message) => set({ error: message }),

  setNotice: (message) => set({ notice: message }),
}));

// Движок общий для плеера, эквалайзера и визуализатора: подписываемся один раз.
engine.events = {
  onTime: (position, duration) => usePlayer.setState({ position, duration }),
  onEnded: () => void onTrackEnded(),
  onError: (message) => usePlayer.setState({ error: message, buffering: false, loading: false }),
  onPlayingChange: (playing) => usePlayer.setState({ playing, loading: false }),
  onBufferingChange: (buffering) => usePlayer.setState({ buffering }),
};

const initial = usePlayer.getState();
engine.setVolume(initial.volume, initial.muted);

export const currentTrack = (state: PlayerState): Track | null => state.queue[state.index] ?? null;
