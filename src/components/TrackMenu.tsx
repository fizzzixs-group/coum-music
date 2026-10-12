import { useState } from "react";

import type { Track } from "@/api/types";
import { useLibrary } from "@/store/library";
import { usePlayer } from "@/store/player";
import { IconHeart, IconPlay, IconPlus, IconQueue, IconWave } from "./Icons";
import { Menu, type MenuEntry } from "./Menu";
import { PlaylistDialog } from "./PlaylistDialog";

type Props = {
  track: Track;
  x: number;
  y: number;
  onClose: () => void;
};

/** Меню трека: обычное воспроизведение, волна по треку, очередь, избранное. */
export function TrackMenu({ track, x, y, onClose }: Props) {
  const playTracks = usePlayer((s) => s.playTracks);
  const seedWaveFromTrack = usePlayer((s) => s.seedWaveFromTrack);
  const enqueue = usePlayer((s) => s.enqueue);
  const liked = useLibrary((s) => s.likedIds.has(track.id));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const [picker, setPicker] = useState(false);

  const entries: MenuEntry[] = [
    {
      id: "play",
      title: "Играть",
      icon: <IconPlay size={18} />,
      onSelect: () => void playTracks([track], 0, null),
    },
    {
      id: "wave",
      title: "Включить волну по треку",
      sub: "трек доиграет — дальше похожее",
      icon: <IconWave size={18} />,
      disabled: !track.available,
      onSelect: () => void seedWaveFromTrack(track),
    },
    {
      id: "queue",
      title: "В очередь",
      icon: <IconQueue size={18} />,
      onSelect: () => enqueue(track),
    },
    {
      id: "playlist",
      title: "Добавить в плейлист",
      icon: <IconPlus size={18} />,
      onSelect: () => setPicker(true),
    },
    "sep",
    {
      id: "like",
      title: liked ? "Убрать из избранного" : "В избранное",
      icon: <IconHeart size={18} filled={liked} />,
      active: liked,
      onSelect: () => void toggleLike(track),
    },
  ];

  return (
    <>
      {!picker && <Menu x={x} y={y} entries={entries} onClose={onClose} />}
      {picker && <PlaylistDialog track={track} onClose={onClose} />}
    </>
  );
}
