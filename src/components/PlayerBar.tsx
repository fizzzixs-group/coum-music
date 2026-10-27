import { useEffect, useState } from "react";

import { formatSeconds, shownDuration } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { usePlayer } from "@/store/player";
import { Cover } from "./Cover";
import {
  IconHeart,
  IconMore,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconQueue,
  IconVolume,
  IconVolumeLow,
  IconVolumeMute,
  IconWave,
} from "./Icons";
import { canOpenMenu, Menu, type MenuEntry } from "./Menu";
import { Slider } from "./Slider";
import { WaveSlider } from "./WaveSlider";

export function PlayerBar() {
  const track = usePlayer((s) => s.queue[s.index] ?? null);
  const playing = usePlayer((s) => s.playing);
  const loading = usePlayer((s) => s.loading);
  const position = usePlayer((s) => s.position);
  const realDuration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const codec = usePlayer((s) => s.streamCodec);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const seedWaveFromTrack = usePlayer((s) => s.seedWaveFromTrack);
  const enqueue = usePlayer((s) => s.enqueue);

  const liked = useLibrary((s) => (track ? s.likedIds.has(track.id) : false));
  const [scrub, setScrub] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const duration = shownDuration(realDuration, track?.durationMs ?? 0);
  const shown = scrub ?? position;

  useEffect(() => setScrub(null), [track?.id]);

  const VolumeIcon = muted || volume === 0 ? IconVolumeMute : volume < 0.5 ? IconVolumeLow : IconVolume;

  const menuEntries: MenuEntry[] = track
    ? [
        {
          id: "wave",
          title: "Включить волну по треку",
          sub: "трек доиграет — дальше похожее",
          icon: <IconWave size={18} />,
          onSelect: () => void seedWaveFromTrack(track),
        },
        {
          id: "queue",
          title: "В очередь",
          icon: <IconQueue size={18} />,
          onSelect: () => enqueue(track),
        },
        "sep",
        {
          id: "like",
          title: liked ? "Убрать из избранного" : "В избранное",
          icon: <IconHeart size={18} filled={liked} />,
          active: liked,
          onSelect: () => void toggleLike(),
        },
      ]
    : [];

  return (
    <footer
      className="player"
      // На телефоне это компактная строка над навигацией: тап по ней
      // открывает полноэкранный плеер, как в мобильных приложениях.
      onClick={(e) => {
        // Переход в «Мою волну» — только по обложке и названию.
        // Раньше клик по полоске прогресса тоже перебрасывал на волну.
        if (!(e.target as HTMLElement).closest(".player__now")) return;
        if ((e.target as HTMLElement).closest("button")) return;
        useNav.getState().go({ name: "wave" });
      }}
    >
      <div className="player__now">
        {track ? (
          <>
            <button
              className="player__cover-btn"
              onClick={() => useNav.getState().go({ name: "wave" })}
              aria-label="Открыть «Мою волну»"
              title="Открыть «Мою волну»"
            >
              <Cover className="player__cover" src={track.cover} seed={track.id} alt="" />
            </button>
            <div className="player__text">
              <div className="player__title">{track.title}</div>
              <div className="player__artist">{track.artists}</div>
            </div>
            <button
              className="track-row__action"
              data-on={liked}
              style={{ opacity: 1 }}
              aria-label="В избранное"
              onClick={() => void toggleLike()}
            >
              <IconHeart size={18} filled={liked} />
            </button>
          </>
        ) : (
          <div className="player__text">
            <div className="player__title" style={{ color: "var(--on-surface-variant)" }}>
              Ничего не играет
            </div>
            <div className="player__artist">Включи «Мою волну»</div>
          </div>
        )}
      </div>

      <div className="player__center">
        <div className="player__buttons">
          <button className="player__control" aria-label="Предыдущий" onClick={prev} disabled={!track}>
            <IconPrev size={20} />
          </button>
          <button
            className="player__control player__control--play"
            aria-label={playing ? "Пауза" : "Играть"}
            onClick={toggle}
            disabled={loading && !track}
          >
            {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
          </button>
          <button className="player__control" aria-label="Следующий" onClick={next} disabled={!track}>
            <IconNext size={20} />
          </button>
        </div>

        <div className="player__timeline">
          <span className="player__time">{formatSeconds(shown)}</span>
          <WaveSlider
            ariaLabel="Позиция трека"
            value={shown}
            max={duration || 1}
            disabled={!track}
            onChange={(v) => setScrub(v)}
            onCommit={(v) => {
              seek(v);
              setScrub(null);
            }}
          />
          <span className="player__time">{formatSeconds(duration)}</span>
        </div>
      </div>

      <div className="player__right">
        {codec && <span className="player__codec">{codec}</span>}
        <div className="player__volume">
          <button className="player__control" aria-label="Звук" onClick={toggleMute}>
            <VolumeIcon size={19} />
          </button>
          <Slider
            ariaLabel="Громкость"
            value={muted ? 0 : volume}
            max={1}
            onChange={(v) => setVolume(v)}
          />
        </div>
        <button
          className="icon-btn icon-btn--sm"
          aria-label="Ещё"
          disabled={!track}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (!canOpenMenu()) return;
        setMenu({ x: rect.right, y: rect.top - 8 });
          }}
        >
          <IconMore size={18} />
        </button>
      </div>

      {menu && <Menu x={menu.x} y={menu.y} entries={menuEntries} onClose={() => setMenu(null)} />}
    </footer>
  );
}
