import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import logo from "@/assets/logo.png";
import { useNav } from "@/store/nav";
import { IconClose, IconMaximize, IconMinimize, IconSearch } from "./Icons";

/** Своя полоса заголовка: перетаскивание окна, поиск и кнопки управления. */
export function TitleBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useNav((s) => s.searchQuery);
  const setQuery = useNav((s) => s.setSearchQuery);
  const go = useNav((s) => s.go);
  const route = useNav((s) => s.route);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const win = getCurrentWindow();

  return (
    <header className="titlebar">
      <div className="brand">
        <img className="brand__mark" src={logo} alt="Coum Music" />
        <div className="brand__name">
          Coum <span>Music</span>
        </div>
      </div>

      <label className="search-field">
        <IconSearch size={16} />
        <input
          ref={inputRef}
          value={query}
          placeholder="Поиск: треки, исполнители, альбомы"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            go({ name: "search" });
          }}
        />
        {route.name !== "search" && <span className="search-field__hint">Ctrl K</span>}
      </label>

      <div className="window-controls">
        <button className="win-btn" aria-label="Свернуть" onClick={() => void win.minimize()}>
          <IconMinimize />
        </button>
        <button className="win-btn" aria-label="Развернуть" onClick={() => void win.toggleMaximize()}>
          <IconMaximize />
        </button>
        <button className="win-btn win-btn--close" aria-label="Закрыть" onClick={() => void win.close()}>
          <IconClose />
        </button>
      </div>
    </header>
  );
}
