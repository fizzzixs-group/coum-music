import { useWallpaper } from "@/store/wallpaper";

/**
 * Фон окна: растянут от края до края и лежит под всем интерфейсом.
 * Затемнение берёт цвет текущей темы, поэтому фон одинаково уместен
 * и в тёмных, и в светлых темах.
 */
export function Wallpaper() {
  const path = useWallpaper((s) => s.path);
  const isVideo = useWallpaper((s) => s.isVideo);
  const dim = useWallpaper((s) => s.dim);
  const version = useWallpaper((s) => s.version);

  if (!path) return null;

  const src = `http://coumstream.localhost/wallpaper?v=${version}`;

  return (
    <div className="wallpaper" aria-hidden>
      {isVideo ? (
        <video className="wallpaper__media" src={src} autoPlay loop muted playsInline />
      ) : (
        <img className="wallpaper__media" src={src} alt="" />
      )}
      <div className="wallpaper__dim" style={{ opacity: dim }} />
    </div>
  );
}
