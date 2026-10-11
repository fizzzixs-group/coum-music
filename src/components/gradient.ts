/** Плейсхолдер обложки: градиент, одинаковый для одного и того же id. */

const GRADIENTS = [
  ["#7c3aed", "#b6ff3c"],
  ["#ff4d6d", "#7c3aed"],
  ["#3cc8ff", "#7c3aed"],
  ["#b6ff3c", "#3cc8ff"],
  ["#ff9f1c", "#ff4d6d"],
];

export function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const [a, b] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return `linear-gradient(140deg, ${a}, ${b})`;
}
