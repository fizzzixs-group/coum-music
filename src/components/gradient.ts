/** Плейсхолдер обложки: градиент, одинаковый для одного и того же id. */

/**
 * Заглушки обложек собраны из цветов текущей темы, а не из случайной
 * неоновой палитры: в каждой теме плашка выглядит своей и меняется
 * вместе с ней. Форма палитры Material You — два тона одной гаммы.
 */
const GRADIENTS = [
  "linear-gradient(140deg, var(--primary), var(--primary-container))",
  "linear-gradient(140deg, var(--primary-container), var(--surface-4))",
  "linear-gradient(140deg, var(--primary), var(--surface-3))",
  "linear-gradient(140deg, var(--surface-4), var(--primary))",
  "linear-gradient(140deg, var(--primary-container), var(--primary))",
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
