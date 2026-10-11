/** Аудио-движок: один <audio> на всё приложение.
 *
 *  Звук идёт через Web Audio, чтобы работали эквалайзер и визуализатор.
 *  Это возможно только потому, что поток отдаёт наш Rust-прокси
 *  (`http://coumstream.localhost/...`): он присылает CORS-заголовки, и браузер
 *  не считает медиа «чужим». Прямой URL Яндекса для Web Audio не годится —
 *  CDN отдаёт 403 на запросы с Origin и не присылает ACAO, поэтому граф
 *  замолчал бы.
 *
 *  Если Web Audio почему-то недоступен, движок молча играет напрямую.
 */

/** Полосы эквалайзера, Гц — стандартная десятиполосная сетка. */
export const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

/** Предел усиления полосы, дБ. */
export const EQ_RANGE = 12;

export type EngineEvents = {
  onTime: (position: number, duration: number) => void;
  onEnded: () => void;
  onError: (message: string) => void;
  onPlayingChange: (playing: boolean) => void;
  onBufferingChange: (buffering: boolean) => void;
};

export class AudioEngine {
  private audio: HTMLAudioElement;
  /** Номер запроса: защищает от гонок при быстром переключении треков. */
  private request = 0;
  private currentUrl: string | null = null;

  private ctx: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;

  private eqEnabled = true;
  private gains: number[] = EQ_FREQS.map(() => 0);

  events: EngineEvents = {
    onTime: () => {},
    onEnded: () => {},
    onError: () => {},
    onPlayingChange: () => {},
    onBufferingChange: () => {},
  };

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    // Поток идёт с нашего локального адреса — CORS-режим безопасен.
    this.audio.crossOrigin = "anonymous";

    this.audio.addEventListener("timeupdate", () =>
      this.events.onTime(this.audio.currentTime, this.duration()),
    );
    this.audio.addEventListener("durationchange", () =>
      this.events.onTime(this.audio.currentTime, this.duration()),
    );
    this.audio.addEventListener("ended", () => this.events.onEnded());
    this.audio.addEventListener("playing", () => {
      this.events.onBufferingChange(false);
      this.events.onPlayingChange(true);
    });
    this.audio.addEventListener("play", () => this.events.onPlayingChange(true));
    this.audio.addEventListener("pause", () => this.events.onPlayingChange(false));
    this.audio.addEventListener("waiting", () => this.events.onBufferingChange(true));
    this.audio.addEventListener("stalled", () => this.events.onBufferingChange(true));
    this.audio.addEventListener("error", () => {
      this.events.onBufferingChange(false);
      this.events.onError("Не удалось воспроизвести трек");
    });
  }

  /** Собирает граф Web Audio. Вызывается один раз, при первом запуске звука. */
  private ensureGraph(): void {
    if (this.ctx) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(this.audio);

      const filters = EQ_FREQS.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1.1;
        filter.gain.value = this.gains[i] ?? 0;
        return filter;
      });

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.78;

      // source → 10 полос эквалайзера → анализатор → выход
      let node: AudioNode = source;
      for (const filter of filters) {
        node.connect(filter);
        node = filter;
      }
      node.connect(analyser);
      analyser.connect(ctx.destination);

      this.ctx = ctx;
      this.filters = filters;
      this.analyser = analyser;
      this.freqData = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // Без Web Audio звук всё равно должен играть.
      this.ctx = null;
      this.filters = [];
      this.analyser = null;
    }
  }

  private duration(): number {
    const d = this.audio.duration;
    return Number.isFinite(d) ? d : 0;
  }

  /** Загружает поток и начинает воспроизведение. */
  async playUrl(url: string): Promise<void> {
    const id = ++this.request;
    this.currentUrl = url;

    this.ensureGraph();
    if (this.ctx?.state === "suspended") void this.ctx.resume();

    this.audio.src = url;
    this.audio.load();
    try {
      await this.audio.play();
    } catch (e) {
      if (id !== this.request) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      this.events.onError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Браузер заблокировал автовоспроизведение — нажми play"
          : `Не удалось начать воспроизведение: ${describe(e)}`,
      );
    }
  }

  pause(): void {
    this.audio.pause();
  }

  async resume(): Promise<void> {
    if (!this.currentUrl) return;
    try {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
    } catch (e) {
      this.events.onError(`AudioContext не возобновился: ${describe(e)}`);
      return;
    }
    try {
      await this.audio.play();
    } catch (e) {
      // Прерванный новым load() play() — не ошибка, просто гонка.
      if (e instanceof DOMException && e.name === "AbortError") return;
      this.events.onError(`play() отклонён: ${describe(e)}`);
    }
  }

  stop(): void {
    this.request++;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.currentUrl = null;
  }

  seek(seconds: number): void {
    if (this.audio.duration && Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = Math.min(Math.max(seconds, 0), this.audio.duration);
    }
  }

  get position(): number {
    return this.audio.currentTime;
  }

  get hasSource(): boolean {
    return this.currentUrl !== null;
  }

  get webAudioReady(): boolean {
    return this.analyser !== null;
  }

  setVolume(value: number, muted: boolean): void {
    this.audio.volume = muted ? 0 : Math.min(Math.max(value, 0), 1);
  }

  // ─────────────────────────── Эквалайзер ───────────────────────────

  setEqEnabled(enabled: boolean): void {
    this.eqEnabled = enabled;
    this.applyGains();
  }

  setEqGains(gains: number[]): void {
    this.gains = gains.slice();
    this.applyGains();
  }

  private applyGains(): void {
    this.filters.forEach((filter, i) => {
      filter.gain.value = this.eqEnabled ? (this.gains[i] ?? 0) : 0;
    });
  }

  // ─────────────────────────── Визуализатор ───────────────────────────

  /** Уровни для столбиков: `count` значений от 0 до 1, по возрастанию частоты. */
  levels(count: number): number[] {
    const analyser = this.analyser;
    const data = this.freqData;
    if (!analyser || !data) return new Array(count).fill(0);

    analyser.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);

    // Полосы логарифмические: низким частотам в спектре достаётся мало бинов,
    // поэтому делим диапазон по логарифму, а не поровну.
    const nyquist = (this.ctx?.sampleRate ?? 48000) / 2;
    const out: number[] = [];
    const minHz = 40;
    const maxHz = Math.min(14000, nyquist);

    for (let i = 0; i < count; i++) {
      const from = minHz * Math.pow(maxHz / minHz, i / count);
      const to = minHz * Math.pow(maxHz / minHz, (i + 1) / count);
      const binFrom = Math.max(1, Math.floor((from / nyquist) * data.length));
      const binTo = Math.max(binFrom + 1, Math.ceil((to / nyquist) * data.length));

      let sum = 0;
      let n = 0;
      for (let b = binFrom; b < binTo && b < data.length; b++) {
        sum += data[b];
        n++;
      }
      out.push(n > 0 ? sum / n / 255 : 0);
    }
    return out;
  }
}

/** Один движок на приложение — его настраивает стор плеера. */
export const engine = new AudioEngine();

function describe(e: unknown): string {
  if (e instanceof DOMException) return `${e.name}: ${e.message}`;
  if (e instanceof Error) return e.message;
  return String(e);
}
