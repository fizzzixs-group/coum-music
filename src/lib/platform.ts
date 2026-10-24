import { useEffect, useState } from "react";

/**
 * Определяем, что приложение запущено на телефоне.
 *
 * Значение считается один раз при загрузке модуля: если проверять в каждом
 * компоненте отдельно, они могут разойтись (например, из-за строки браузера
 * на конкретном устройстве) — и часть экранов станет мобильной, а часть нет.
 */
const MOBILE_UA = /Android|iPhone|iPad|iPod/i;

function detectMobile(): boolean {
  // Флаг сборки: позволяет посмотреть мобильный вид на компьютере, собрав
  // приложение с VITE_FORCE_MOBILE=1. В обычных сборках он не задан.
  if (import.meta.env.VITE_FORCE_MOBILE === "1") return true;

  if (MOBILE_UA.test(navigator.userAgent)) return true;
  // Подстраховка: если система назвалась иначе, мобильность выдадут
  // несколько точек касания и отсутствие точного указателя.
  const touch = navigator.maxTouchPoints > 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return touch && coarse;
}

const MOBILE = detectMobile();

/** Признак телефона — одинаковый для всех компонентов. */
export function isMobilePlatform(): boolean {
  return MOBILE;
}

/** Порог, ниже которого включаем мобильную раскладку на компьютере. */
const MOBILE_WIDTH = 820;

export function useIsMobile(): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < MOBILE_WIDTH);

  useEffect(() => {
    // На телефоне вид всегда мобильный, независимо от поворота экрана.
    if (MOBILE) return;

    const onResize = () => setNarrow(window.innerWidth < MOBILE_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return MOBILE || narrow;
}
