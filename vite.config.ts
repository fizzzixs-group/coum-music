import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

// Tauri ждёт фиксированный порт и не любит, когда Vite «прыгает» на другой.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Именно 127.0.0.1: Tauri CLI опрашивает dev-сервер по этому адресу,
    // а «localhost» на Windows может уехать в IPv6 и повиснуть в ожидании.
    host: host || "127.0.0.1",
    hmr: host
      ? { protocol: "ws", host, port: 1421, overlay: false }
      : // Оверлей ошибок перекрывает всё окно приложения: любая случайная
        // ошибка dev-сервера делает интерфейс некликабельным.
        { overlay: false },
    watch: {
      // .tmpdir — временные файлы атомарной записи: Windows держит их под локом,
      // и watcher падает с EBUSY прямо во время работы.
      ignored: ["**/src-tauri/**", "**/.tools/**", "**/releases/**", "**/*.tmpdir/**", "**/*.tmp"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "chrome120",
    minify: "esbuild",
    sourcemap: false,
  },
});
