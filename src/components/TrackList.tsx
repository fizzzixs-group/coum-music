import type { Track } from "@/api/types";
import { currentTrack, usePlayer } from "@/store/player";
import { TrackRow } from "./TrackRow";

type Props = {
  tracks: Track[];
  /** С чего начинать, если трек-лист не является текущей очередью. */
  onPlayIndex: (index: number) => void;
  /** Показывать строку с номером/названием/альбомом. */
  withHead?: boolean;
};

export function TrackList({ tracks, onPlayIndex, withHead = true }: Props) {
  const current = usePlayer(currentTrack);
  const playing = usePlayer((s) => s.playing);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);

  // Список считается «своим» для плеера, только если очередь совпадает с ним
  // один в один — иначе подсветка сработала бы на чужом списке той же длины.
  const isOwnQueue =
    tracks.length > 0 &&
    queue.length === tracks.length &&
    queue.every((t, i) => t.id === tracks[i].id);

  return (
    <div className="tracklist">
      {withHead && (
        <div className="tracklist__head">
          <span>#</span>
          <span>Трек</span>
          <span>Альбом</span>
          <span style={{ textAlign: "right" }}>Время</span>
          <span />
          <span />
        </div>
      )}
      {tracks.map((track, i) => (
        <TrackRow
          key={`${track.id}-${i}`}
          track={track}
          index={i}
          isCurrent={isOwnQueue && index === i}
          isPlaying={playing && current?.id === track.id}
          onPlay={() => onPlayIndex(i)}
        />
      ))}
    </div>
  );
}
