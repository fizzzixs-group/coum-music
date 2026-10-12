import { useState } from "react";

import { WAVE_STATION, isWaveSource, sourceLabel } from "@/api/types";
import { Cover } from "@/components/Cover";
import {
  IconHeart,
  IconMore,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconSparkle,
  IconVolume,
  IconVolumeLow,
  IconVolumeMute,
} from "@/components/Icons";
import { Menu, type MenuEntry } from "@/components/Menu";
import { QueuePopover } from "@/components/QueuePopover";
import { Slider } from "@/components/Slider";
import { Visualizer } from "@/components/Visualizer";
import { formatSeconds } from "@/lib/format";
import { useLibrary } from "@/store/library";
import { useNav } from "@/store/nav";
import { usePlayer } from "@/store/player";

/**
 * «Моя волна» — это и есть режим «сейчас играет»: обложка, живой спектр и
 * управление. Отдельного экрана, который надо включать, больше нет, поэтому
 * нижний плеер на этой вкладке скрыт.
 */
export function WaveView() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playing = usePlayer((s) => s.playing);
  const loading = usePlayer((s) => s.loading);
  const source = usePlayer((s) => s.source);
  const seedContinuation = usePlayer((s) => s.seedContinuation);
  const position = usePlayer((s) => s.position);
  const realDuration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const startWave = usePlayer((s) => s.startWave);
  const seedWaveFromTrack = usePlayer((s) => s.seedWaveFromTrack);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const enqueue = usePlayer((s) => s.enqueue);

  const go = useNav((s) => s.go);
  const track = queue[index] ?? null;
  const liked = useLibrary((s) => (track ? s.likedIds.has(track.id) : false));
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [queueOpen, setQueueOpen] = useState<{ x: number; y: number } | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);

  const duration = realDuration > 0 ? realDuration : (track?.durationMs ?? 0) / 1000;
  const shown = scrub ?? position;
  const VolumeIcon = muted || volume === 0 ? IconVolumeMute : volume < 0.5 ? IconVolumeLow : IconVolume;

  if (!track) {
    return (
      <div className="now">
        <div className="now__stage-empty">
          {loading && <div className="spinner" />}
          <div className="empty__title">Моя волна</div>
          <p style={{ maxWidth: 420, margin: 0, color: "var(--on-surface-variant)" }}>
            Включай — и дальше подбор идёт сам: волна учитывает, что ты слушаешь, лайкаешь и
            проматываешь.
          </p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => void startWave()}>
            Включить волну
          </button>
        </div>
      </div>
    );
  }

  const label = sourceLabel(source);
  const isWave = isWaveSource(source);
  const isSeeded = source?.kind === "wave" && source.station !== WAVE_STATION;

  const menuEntries: MenuEntry[] = [
    {
      id: "wave-by-track",
      title: "Волна по этому треку",
      sub: "доиграет — и подбор пойдёт от него",
      icon: <IconSparkle size={18} />,
      onSelect: () => void seedWaveFromTrack(track),
    },
    {
      id: "queue",
      title: "В очередь",
      icon: <IconNext size={18} />,
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
    ...(isSeeded
      ? ([
          "sep",
          { id: "home", title: "Вернуться в Мою волну", onSelect: () => void startWave() },
        ] as MenuEntry[])
      : []),
  ];

  return (
    <div className="now">
      <header className="now__header">
        {/* Плашка с источником: показывает, что играет — волну, плейлист или
            избранное. По клику открывается очередь в миниатюре. */}
        <button
          className="now__badge"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setQueueOpen({ x: rect.left, y: rect.bottom + 8 });
          }}
          title="Показать очередь"
        >
          <IconSparkle size={13} />
          <span>{label}</span>
          {seedContinuation ? <b>· дальше похожее</b> : null}
        </button>

        <div className="now__header-right">
          {!isWave && (
            <button className="btn-ghost now__wave-btn" onClick={() => void startWave()}>
              <IconSparkle size={15} />
              Включить волну
            </button>
          )}

          {/* Громкость прямо здесь: нижний плеер на этой вкладке скрыт. */}
          <div className="now__volume">
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
        </div>
      </header>

      <div className="now__body now__body--solo">
        <div className="now__side now__side--center">
          <Cover className="now__cover" src={track.cover} seed={track.id} alt="" />
          <h1 className="now__title" title={track.title}>
            {track.title}
          </h1>

          <div className="now__artists">
            {track.artistList.length > 0 ? (
              track.artistList.map((artist) => (
                <button
                  key={artist.id}
                  className="now__artist-link"
                  onClick={() => go({ name: "artist", id: artist.id, title: artist.name })}
                  title={`Все треки: ${artist.name}`}
                >
                  {artist.name}
                </button>
              ))
            ) : (
              <span className="now__artist">{track.artists}</span>
            )}
          </div>

          {track.album && <div className="now__album">{track.album}</div>}

          {/* Спектр ровно по ширине обложки — чтобы всё было по одной оси. */}
          <Visualizer className="now__viz" bars={10} height={92} />
        </div>
      </div>

      <div className="now__timeline">
        <span className="now__time">{formatSeconds(shown)}</span>
        <Slider
          ariaLabel="Позиция трека"
          value={shown}
          max={duration || 1}
          onChange={(v) => setScrub(v)}
          onCommit={(v) => {
            seek(v);
            setScrub(null);
          }}
        />
        <span className="now__time">{formatSeconds(duration)}</span>
      </div>

      <div className="now__controls">
        <button
          className="round-btn"
          data-active={liked}
          aria-label="В избранное"
          onClick={() => void toggleLike()}
        >
          <IconHeart size={20} filled={liked} />
        </button>
        <button className="round-btn round-btn--sm" aria-label="Предыдущий" onClick={prev}>
          <IconPrev size={18} />
        </button>
        <button
          className="round-btn round-btn--play"
          aria-label={playing ? "Пауза" : "Играть"}
          onClick={toggle}
        >
          {loading ? <span className="spinner" /> : playing ? <IconPause size={26} /> : <IconPlay size={26} />}
        </button>
        <button className="round-btn round-btn--sm" aria-label="Следующий" onClick={next}>
          <IconNext size={18} />
        </button>
        <button
          className="round-btn"
          aria-label="Ещё"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.right, y: rect.bottom + 6 });
          }}
        >
          <IconMore size={20} />
        </button>
      </div>

      {menu && <Menu x={menu.x} y={menu.y} entries={menuEntries} onClose={() => setMenu(null)} />}
      {queueOpen && (
        <QueuePopover x={queueOpen.x} y={queueOpen.y} onClose={() => setQueueOpen(null)} />
      )}
    </div>
  );
}
