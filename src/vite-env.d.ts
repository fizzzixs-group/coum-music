/// <reference types="vite/client" />

/** Версия приложения подставляется Vite из package.json (см. vite.config.ts). */
declare const __APP_VERSION__: string;

/**
 * Переменные сборки. `VITE_FORCE_MOBILE=1` включает мобильный вид на
 * компьютере — так раскладку для телефона можно проверить без устройства.
 */
interface ImportMetaEnv {
  readonly VITE_FORCE_MOBILE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
