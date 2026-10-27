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
  // Папка со скриншотами пользователя: они уже разложены в docs/screenshots.
  "срины",
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
  const request = () =>
    fetch(base + path, {
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

  // Сеть иногда рвётся на середине заливки: повторяем запрос, а не падаем.
  let res;
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      res = await request();
      lastError = null;
      break;
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }
  }
  if (!res) throw lastError ?? new Error("сеть недоступна");

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

Промежуточное обновление: кастомизация интерфейса и починка накопившихся багов.

### Добавлено

- **Свои темы.** Кнопка «＋ Своя тема»: выбираешь основной цвет и цвет фона, оттенки и контраст текста подбираются автоматически. Своих тем можно создать сколько угодно.
- **Пикер цвета как в Paint:** квадрат «насыщенность × яркость», ползунок оттенка, поле HEX и палитра быстрых цветов.
- **Формы элементов.** Отдельная настройка для девяти элементов: «играть/пауза», «назад», «вперёд», обложка трека, кружок исполнителя, обложки альбомов, мини-обложка, «три точки» и лайк. Количество волн (0–16) и глубина (0–40 %) для каждого свои.
- **Тумблеры вместо галочек** во всём приложении, с анимацией.
- **Подсветку под обложку** можно выключить одной настройкой.
- **Версии треков** в названии: Sped Up, Hardstyle, Remix — раньше они терялись.
- **Обложки плейлистов:** если своей нет, подставляется обложка первой песни.

### Исправлено

- **Альбомы не открывались** — «Треков не нашлось». Треки лежат в поле volumes, а разбор ждал другой формат.
- **Плейлисты:** переименование, удаление и смена обложки по правому клику; своя обложка сохраняется между вкладками.
- **Меню на «трёх точках»:** повторное нажатие закрывает, меню не обрезается списком и не касается края окна.
- **«Мне нравится»:** убранный лайк больше не удаляет трек из списка сразу — трек остаётся до выхода с вкладки.
- **Двойной клик по кнопкам строки** больше не запускает трек.
- **Клик по полоске прогресса** больше не перебрасывает в «Мою волну».
- **Формы не лезут на чужие кнопки:** «назад», «вперёд» и громкость больше не наследуют форму «трёх точек».
- Убраны лишние элементы интерфейса: метка MP3 и системное меню браузера по правому клику.

### Установка

Скачай установщик или портативный coum-music.exe из файлов ниже.

Windows покажет окно «неизвестный издатель» — сертификат стоит от 100 $ в год, у проекта его нет. Жми «Подробнее» → «Выполнить в любом случае». Контрольные суммы — в SHA256SUMS.txt.
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
  ].filter((f) => existsSync(f));

  // Имена, которые должны остаться в релизе (пробелы GitHub заменяет на точки).
  const wanted = assets.map((f) =>
    f.split(/[\\/]/).pop().replace(/\s+/g, "-"),
  );

  // Убираем всё лишнее — например, ассеты от прошлых запусков с другим именем.
  for (const asset of release.assets ?? []) {
    if (wanted.includes(asset.name)) continue;
    await api(`/repos/${owner}/${REPO}/releases/assets/${asset.id}`, { method: "DELETE" });
    console.log(`  удалён старый ассет: ${asset.name}`);
  }

  for (const file of assets) {
    const name = file.split(/[\\/]/).pop().replace(/\s+/g, "-");

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

  // 5. Контрольные суммы — чтобы скачавший мог убедиться, что файл не подменили.
  const { createHash } = await import("node:crypto");
  const sums = assets.map((file) => {
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
    const name = file.split(/[\\/]/).pop().replace(/\s+/g, "-");
    return `${hash}  ${name}`;
  });
  const sumsBody = `Контрольные суммы SHA-256 для Coum Music ${VERSION}\n\n${sums.join("\n")}\n\nПроверить: certutil -hashfile "<файл>" SHA256\n`;
  const sumsName = "SHA256SUMS.txt";
  const oldSums = (release.assets ?? []).find((a) => a.name === sumsName);
  if (oldSums) {
    await api(`/repos/${owner}/${REPO}/releases/assets/${oldSums.id}`, { method: "DELETE" });
  }
  const sumsRes = await fetch(
    `${UPLOADS}/repos/${owner}/${REPO}/releases/${release.id}/assets?name=${sumsName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "text/plain; charset=utf-8",
        "User-Agent": "coum-music-publisher",
      },
      body: sumsBody,
    },
  );
  console.log(sumsRes.ok ? `  загружено: ${sumsName}` : `  ${sumsName} не залился: ${sumsRes.status}`);

  console.log(`\nГотово: https://github.com/${owner}/${REPO}`);
}

main().catch((e) => {
  console.error("\nОшибка: " + e.message);
  process.exit(1);
});
