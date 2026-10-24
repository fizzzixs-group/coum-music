/** Мелкие форматтеры. */

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatSeconds(seconds: number): string {
  return formatTime(seconds * 1000);
}

/** «12 треков», «1 трек», «3 трека». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function trackCount(n: number): string {
  return plural(n, "трек", "трека", "треков");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
}

/**
 * Какую длительность показать.
 *
 * Chromium оценивает длительность потока по размеру файла и битрейту, и на
 * некоторых треках выдаёт чушь вроде «2507:20». Если его оценка сильно
 * расходится с данными трека — верим метаданным.
 */
export function shownDuration(realSeconds: number, durationMs: number): number {
  const meta = durationMs / 1000;
  if (realSeconds <= 0) return meta;
  if (meta <= 0) return realSeconds;
  const tolerance = Math.max(5, meta * 0.25);
  return Math.abs(realSeconds - meta) <= tolerance ? realSeconds : meta;
}
