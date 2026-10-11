import { gradientFor } from "./gradient";
import { IconNote } from "./Icons";

type Props = {
  src: string | null | undefined;
  seed: string;
  className?: string;
  round?: boolean;
  alt?: string;
};

/** Обложка с градиентным плейсхолдером, если у трека/плейлиста нет картинки. */
export function Cover({ src, seed, className, round, alt = "" }: Props) {
  const style = round ? { borderRadius: "50%" } : undefined;

  if (!src) {
    return (
      <div
        className={className}
        style={{ background: gradientFor(seed), display: "grid", placeItems: "center", ...style }}
        aria-hidden
      >
        <IconNote size={18} />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      style={style}
      onError={(e) => {
        // Битая ссылка на обложку не должна ломать вёрстку.
        e.currentTarget.style.background = gradientFor(seed);
        e.currentTarget.removeAttribute("src");
      }}
    />
  );
}
