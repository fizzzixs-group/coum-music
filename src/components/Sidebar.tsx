import { useNav } from "@/store/nav";
import { usePlayer } from "@/store/player";
import { IconHeart, IconNote, IconSettings, IconWave } from "./Icons";

/**
 * Панель навигации: всегда свёрнута до значков и раскрывается при наведении
 * на левую стенку. Поиска здесь нет — строка поиска есть в шапке всегда.
 */
export function Sidebar() {
  const route = useNav((s) => s.route);
  const go = useNav((s) => s.go);
  const startWave = usePlayer((s) => s.startWave);

  const items = [
    {
      id: "wave",
      label: "Моя волна",
      icon: <IconWave size={20} />,
      active: route.name === "wave",
      onClick: () => {
        go({ name: "wave" });
        // Станцию запускаем только если её ещё нет: иначе возврат из другого
        // раздела каждый раз начинал бы волну заново.
        const player = usePlayer.getState();
        if (player.source?.kind !== "wave" || player.queue.length === 0) void startWave();
      },
    },
    {
      id: "playlists",
      label: "Плейлисты",
      icon: <IconNote size={20} />,
      active: route.name === "playlists" || route.name === "playlist",
      onClick: () => go({ name: "playlists" }),
    },
    {
      id: "likes",
      label: "Мне нравится",
      icon: <IconHeart size={20} />,
      active: route.name === "likes",
      onClick: () => go({ name: "likes" }),
    },
    {
      id: "settings",
      label: "Настройки",
      icon: <IconSettings size={20} />,
      active: route.name === "settings",
      onClick: () => go({ name: "settings" }),
    },
  ];

  return (
    <aside className="sidebar">
      {items.map((item) => (
        <button
          key={item.id}
          className="nav-item"
          aria-current={item.active}
          title={item.label}
          onClick={item.onClick}
        >
          <span className="nav-item__icon">{item.icon}</span>
          <span className="nav-item__label">{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
