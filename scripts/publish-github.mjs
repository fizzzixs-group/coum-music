/**
 * Публикация Coum Music на GitHub без установленного git.
 *
 * Всё делается через REST API: репозиторий, один коммит со всеми файлами
 * (Git Data API) и релиз с готовыми сборками в ассетах.
 *
 * Запуск:
 *   node scripts/publish-github.mjs            # токен из GITHUB_TOKEN
 *   node scripts/publish-github.mjs --dry-run  # только показать, что будет залито
 *
 * Токен нужен класса classic со scope `repo` (или fine-grained с доступом
 * к содержимому и релизам). Файл токена по умолчанию: .tools/gh-token.txt
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const API = "https://api.github.com";
const UPLOADS = "https://uploads.github.com";
const REPO = "coum-music";
const DRY_RUN = process.argv.includes("--dry-run");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const VERSION = pkg.version;

/** Что не заливаем в репозиторий. */
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "target",
  "gen",
  ".tools",
  "backups",
  "releases",
  ".git",
  ".vscode",
]);

const SKIP_FILES = new Set(["package-lock.json"]);

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  const file = join(ROOT, ".tools", "gh-token.txt");
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  throw new Error(
    "Не найден токен GitHub. Положи его в .tools/gh-token.txt или задай переменную GITHUB_TOKEN.",
  );
}

/** Обход проекта: возвращает пути относительно корня. */
function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") && entry !== ".gitignore") continue;
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      collect(full, out);
    } else {
      if (SKIP_FILES.has(entry)) continue;
      out.push(rel.split(sep).join("/"));
    }
  }
  return out;
}

async function api(path, options = {}, base = API) {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "coum-music-publisher",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* не JSON */
  }

  if (!res.ok) {
    const message = json?.message ?? text.slice(0, 200);
    const error = new Error(`${res.status} ${path}: ${message}`);
    error.status = res.status;
    error.body = json;
    throw error;
  }
  return json;
}

const RELEASE_NOTES = `## Coum Music ${VERSION}

Первый публичный релиз: минималистичный десктоп-клиент Яндекс.Музыки.

**Что внутри**

- **Моя волна** — сразу экран «сейчас играет»: обложка, живой спектр из 10 столбиков (настоящий FFT), управление и громкость на месте.
- **Волна по треку** — три точки на треке → «Включить волну по треку».
- **Исполнители** — клик по имени открывает все его треки.
- Плейлисты отдельной вкладкой, поиск, избранное.
- **12 тем** оформления и **эквалайзер** на 10 полос с пресетами.
- Мгновенное переключение треков: порционная отдача звука, предзагрузка следующего трека, кэш ссылок.

**Файлы**

- \`Coum Music_${VERSION}_x64-setup.exe\` — установщик (рекомендуется).
- \`coum-music.exe\` — портативная версия, работает без установки.

**Установка:** запусти установщик, открой приложение, зайди в Настройки → «Войти через Яндекс».
Токен хранится локально: \`%APPDATA%\\com.coum.music\\session.json\`.

Telegram: [t.me/coumfun](https://t.me/coumfun)
`;

async function main() {
  const files = collect(ROOT);
  const totalBytes = files.reduce((sum, f) => sum + statSync(join(ROOT, f)).size, 0);

  console.log(`Файлов: ${files.length} (${(totalBytes / 1024 / 1024).toFixed(2)} МБ)`);
  if (DRY_RUN) {
    for (const f of files) console.log("  " + f);
    return;
  }

  const me = await api("/user");
  const owner = me.login;
  console.log(`Пользователь: ${owner}`);

  // 1. Репозиторий
  try {
    await api("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: REPO,
        description:
          "Coum Music — минималистичный десктоп-клиент Яндекс.Музыки: Моя волна, плейлисты, поиск. Tauri + React, Material 3, 12 тем, эквалайзер.",
        homepage: "https://t.me/coumfun",
        private: false,
        has_issues: true,
        has_wiki: false,
        has_projects: false,
        auto_init: false,
      }),
    });
    console.log(`Репозиторий создан: ${owner}/${REPO}`);
  } catch (e) {
    if (e.status === 422) console.log(`Репозиторий уже есть: ${owner}/${REPO}`);
    else throw e;
  }

  // 2. Пустой репозиторий не принимает Git Data API («Git Repository is empty»),
  // поэтому сначала создаём в нём первый коммит через Contents API.
  let branch = "main";
  const repoInfo = await api(`/repos/${owner}/${REPO}`);
  branch = repoInfo.default_branch ?? "main";

  try {
    await api(`/repos/${owner}/${REPO}/git/ref/heads/${branch}`);
    console.log(`Ветка ${branch} уже существует`);
  } catch {
    await api(`/repos/${owner}/${REPO}/contents/.coum-init`, {
      method: "PUT",
      body: JSON.stringify({
        message: "Инициализация репозитория",
        content: Buffer.from("Coum Music\n").toString("base64"),
        branch,
      }),
    });
    console.log(`Создан первый коммит в ветке ${branch}`);
  }

  // 3. Блобы → дерево → коммит (один коммит на все файлы)
  console.log("Загружаю файлы…");
  const tree = [];
  for (const file of files) {
    const content = readFileSync(join(ROOT, file));
    const blob = await api(`/repos/${owner}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
    });
    tree.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
  }

  const treeRes = await api(`/repos/${owner}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ tree }),
  });

  const ref = await api(`/repos/${owner}/${REPO}/git/ref/heads/${branch}`);

  const commit = await api(`/repos/${owner}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `Coum Music ${VERSION}: волна, плейлисты, поиск, темы и эквалайзер`,
      tree: treeRes.sha,
      parents: [ref.object.sha],
    }),
  });

  await api(`/repos/${owner}/${REPO}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
  console.log(`Коммит: ${commit.sha.slice(0, 7)}`);

  // 3. Оформление репозитория
  await api(`/repos/${owner}/${REPO}`, {
    method: "PATCH",
    body: JSON.stringify({
      description:
        "Coum Music — минималистичный десктоп-клиент Яндекс.Музыки: Моя волна, плейлисты, поиск. Tauri + React, Material 3, 12 тем, эквалайзер.",
      homepage: "https://t.me/coumfun",
    }),
  });
  await api(`/repos/${owner}/${REPO}/topics`, {
    method: "PUT",
    body: JSON.stringify({
      names: ["yandex-music", "tauri", "react", "typescript", "music-player", "desktop-app", "material-you"],
    }),
  });

  // 4. Релиз с готовыми сборками
  const tag = `v${VERSION}`;
  let release;
  try {
    release = await api(`/repos/${owner}/${REPO}/releases`, {
      method: "POST",
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: "main",
        name: `Coum Music ${VERSION}`,
        body: RELEASE_NOTES,
        draft: false,
        prerelease: false,
      }),
    });
    console.log(`Релиз ${tag} создан`);
  } catch (e) {
    if (e.status === 422) {
      release = await api(`/repos/${owner}/${REPO}/releases/tags/${tag}`);
      console.log(`Релиз ${tag} уже есть, обновляю файлы`);
    } else throw e;
  }

  const assets = [
    join(ROOT, "releases", `CoumMusic-${VERSION}-win-x64.zip`),
    join(ROOT, "releases", `v${VERSION}`, `Coum Music_${VERSION}_x64-setup.exe`),
    join(ROOT, "releases", `v${VERSION}`, "coum-music.exe"),
  ];

  for (const file of assets) {
    if (!existsSync(file)) {
      console.log(`  пропускаю (нет файла): ${file}`);
      continue;
    }
    const name = file.split(/[\\/]/).pop();

    // Если ассет с таким именем уже есть — удаляем, чтобы перезалить.
    const existing = (release.assets ?? []).find((a) => a.name === name);
    if (existing) {
      await api(`/repos/${owner}/${REPO}/releases/assets/${existing.id}`, { method: "DELETE" });
    }

    const res = await fetch(
      `${UPLOADS}/repos/${owner}/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/octet-stream",
          "User-Agent": "coum-music-publisher",
        },
        body: readFileSync(file),
      },
    );
    if (!res.ok) {
      console.log(`  не залилось ${name}: ${res.status} ${(await res.text()).slice(0, 120)}`);
    } else {
      const size = (statSync(file).size / 1024 / 1024).toFixed(2);
      console.log(`  загружено: ${name} (${size} МБ)`);
    }
  }

  console.log(`\nГотово: https://github.com/${owner}/${REPO}`);
}

main().catch((e) => {
  console.error("\nОшибка: " + e.message);
  process.exit(1);
});
