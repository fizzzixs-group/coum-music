import { useNav } from "@/store/nav";
import { IconHeart, IconNote, IconSettings, IconWave } from "./Icons";

/**
 * Нижняя навигация для телефона: слева вверху она была бы недоступна
 * большим пальцем, а наведения курсора на тач-экране просто нет.
 */
export function BottomNav() {
  const route = useNav((s) => s.route);
  const go = useNav((s) => s.go);

  const items = [
    { id: "wave", label: "Волна", icon: <IconWave size={22} />, active: route.name === "wave" },
    {
      id: "playlists",
      label: "Плейлисты",
      icon: <IconNote size={22} />,
      active: route.name === "playlists" || route.name === "playlist",
    },
    { id: "likes", label: "Избранное", icon: <IconHeart size={22} />, active: route.name === "likes" },
    {
      id: "settings",
      label: "Настройки",
      icon: <IconSettings size={22} />,
      active: route.name === "settings",
    },
  ] as const;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__pill">
        {items.map((item) => (
          <button
            key={item.id}
            className="bottom-nav__item"
            data-active={item.active}
            onClick={() => go({ name: item.id } as never)}
            aria-label={item.label}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
