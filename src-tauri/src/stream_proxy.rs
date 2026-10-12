//! Локальный прокси аудиопотока.
//!
//! Зачем он нужен: CDN Яндекса отдаёт **403, если в запросе есть заголовок Origin**,
//! и никогда не присылает `Access-Control-Allow-Origin`. Из-за этого Web Audio
//! считает поток «чужим» и глушит звук — то есть эквалайзер и визуализатор
//! на прямом URL работать не могут в принципе.
//!
//! Поэтому байты идут через Rust: вебвью обращается к локальному адресу
//! `http://coumstream.localhost/<id>`, наш обработчик сам скачивает нужный
//! диапазон у Яндекса (без Origin и Referer) и отдаёт его с нужными
//! CORS-заголовками. Побочный плюс — подписанный URL больше не светится в JS.
//!
//! Две вещи, без которых всё работало бы плохо:
//!  * **Порционная отдача.** Обработчик схемы Tauri требует тело целиком в памяти,
//!    поэтому скачивать весь трек до старта нельзя — иначе плеер ждёт несколько
//!    мегабайт. Отдаём по [`CHUNK`] байт и сообщаем полный размер в `Content-Range`,
//!    а Chromium сам запрашивает следующие куски.
//!  * **Кэш подписанных адресов.** Ссылки живут недолго; держим их по id трека
//!    и перезапрашиваем при 403/410, чтобы переключение трека не ждало сеть.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::http::{header, Method, Request, Response, StatusCode};
use tauri::{AppHandle, Manager, Runtime, UriSchemeContext, UriSchemeResponder};

use crate::state::AppState;

/// Имя локальной схемы.
pub const SCHEME: &str = "coumstream";

/// Сколько байт отдаём за один ответ. Первый кусок приходит почти сразу,
/// поэтому воспроизведение начинается моментально.
const CHUNK: u64 = 1024 * 1024;

/// Сколько держим подписанный адрес, прежде чем взять свежий.
const URL_TTL: Duration = Duration::from_secs(15 * 60);

/// Адрес, по которому вебвью забирает поток.
pub fn local_url(id: u64) -> String {
    format!("http://{SCHEME}.localhost/{id}")
}

struct Entry {
    track_id: String,
    url: String,
    at: Instant,
}

/// Соответствие «короткий id → трек и его подписанный адрес».
#[derive(Default)]
pub struct StreamRegistry {
    entries: Mutex<HashMap<u64, Entry>>,
    /// Кэш по id трека: повторное включение того же трека не ждёт сеть.
    by_track: Mutex<HashMap<String, (String, Instant)>>,
    next: AtomicU64,
}

impl StreamRegistry {
    /// Регистрирует трек вместе с уже полученным адресом.
    ///
    /// Адрес передаём сюда сразу: раньше команда `stream` резолвила ссылку,
    /// чтобы узнать кодек, а прокси резолвил её второй раз — из-за этого
    /// на каждый трек уходило вдвое больше запросов, и Яндекс отвечал
    /// `429 Concurrency limit exceeded`.
    pub fn register(&self, track_id: String, url: String) -> u64 {
        let id = self.next.fetch_add(1, Ordering::Relaxed) + 1;
        let now = Instant::now();

        let mut map = self.entries.lock().unwrap();
        // Сессия может идти часами: не даём словарю расти бесконечно.
        if map.len() > 128 {
            map.clear();
        }
        map.insert(
            id,
            Entry { track_id: track_id.clone(), url: url.clone(), at: now },
        );
        drop(map);

        self.by_track.lock().unwrap().insert(track_id, (url, now));
        id
    }

    fn get(&self, id: u64) -> Option<(String, String)> {
        let map = self.entries.lock().unwrap();
        map.get(&id).map(|e| (e.track_id.clone(), e.url.clone()))
    }

    fn is_fresh(&self, id: u64) -> bool {
        self.entries
            .lock()
            .unwrap()
            .get(&id)
            .map(|e| !e.url.is_empty() && e.at.elapsed() < URL_TTL)
            .unwrap_or(false)
    }

    fn set_url(&self, id: u64, track_id: &str, url: String) {
        if let Some(entry) = self.entries.lock().unwrap().get_mut(&id) {
            entry.url = url.clone();
            entry.at = Instant::now();
        }
        self.by_track
            .lock()
            .unwrap()
            .insert(track_id.to_string(), (url, Instant::now()));
    }
}

/// Обработчик схемы: `/wallpaper` отдаёт выбранный фон, `/N` — аудиопоток.
pub fn handle<R: Runtime>(
    ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let path = request.uri().path().trim_start_matches('/').to_string();
    let is_head = request.method() == Method::HEAD;
    let range = request
        .headers()
        .get(header::RANGE)
        .and_then(|v| v.to_str().ok())
        .map(str::to_string);
    let app = ctx.app_handle().clone();

    tauri::async_runtime::spawn(async move {
        let response = if path == "wallpaper" {
            match serve_wallpaper(&app, range, is_head) {
                Ok(r) => r,
                Err(e) => problem(StatusCode::NOT_FOUND, &e),
            }
        } else {
            match path.parse::<u64>() {
                Ok(id) => match serve(&app, id, range, is_head).await {
                    Ok(r) => r,
                    Err(e) => problem(StatusCode::BAD_GATEWAY, &e),
                },
                Err(_) => problem(StatusCode::BAD_REQUEST, "некорректный идентификатор потока"),
            }
        };
        responder.respond(response);
    });
}

/// Папка с выбранным фоном.
pub fn wallpaper_dir<R: Runtime>(app: &AppHandle<R>) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("wallpaper");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Файл фона. Обычно он один (перед сохранением папка очищается), но если
/// файлов всё-таки несколько — берём самый свежий, чтобы выбор был однозначным.
pub fn wallpaper_file<R: Runtime>(app: &AppHandle<R>) -> Option<std::path::PathBuf> {
    let dir = wallpaper_dir(app).ok()?;
    std::fs::read_dir(dir)
        .ok()?
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.is_file())
        .max_by_key(|p| std::fs::metadata(p).and_then(|m| m.modified()).ok())
}

fn mime_for(path: &std::path::Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "avif" => "image/avif",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        _ => "application/octet-stream",
    }
}

/// Отдаёт файл фона с поддержкой Range: без неё видео не проигрывается.
fn serve_wallpaper<R: Runtime>(
    app: &AppHandle<R>,
    range: Option<String>,
    is_head: bool,
) -> Result<Response<Vec<u8>>, String> {
    let path = wallpaper_file(app).ok_or_else(|| "фон не выбран".to_string())?;
    let total = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();

    let start = range_start(range.as_deref()).min(total.saturating_sub(1));
    // Для картинок отдаём файл целиком, для видео — кусками.
    let is_video = matches!(mime_for(&path), "video/mp4" | "video/webm");
    let end = if is_video {
        (start + CHUNK - 1).min(total.saturating_sub(1))
    } else {
        total.saturating_sub(1)
    };

    let mime = mime_for(&path);
    let mut builder = Response::builder()
        .status(if is_video { StatusCode::PARTIAL_CONTENT } else { StatusCode::OK })
        .header(header::CONTENT_TYPE, mime)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(header::CACHE_CONTROL, "no-store");

    if !is_video {
        // Картинку можно кэшировать: путь меняется вместе с версией в query.
        builder = builder.header(header::CACHE_CONTROL, "max-age=31536000");
    } else {
        builder = builder.header(
            header::CONTENT_RANGE,
            format!("bytes {start}-{end}/{total}"),
        );
    }

    if is_head {
        return builder
            .header(header::CONTENT_LENGTH, (end - start + 1).to_string())
            .body(Vec::new())
            .map_err(|e| e.to_string());
    }

    use std::io::{Read, Seek, SeekFrom};
    let mut file = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    file.seek(SeekFrom::Start(start)).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; (end - start + 1) as usize];
    file.read_exact(&mut buf).map_err(|e| e.to_string())?;

    builder
        .header(header::CONTENT_LENGTH, buf.len().to_string())
        .body(buf)
        .map_err(|e| e.to_string())
}

/// Начало запрошенного диапазона (`bytes=START-...`).
fn range_start(range: Option<&str>) -> u64 {
    range
        .and_then(|r| r.strip_prefix("bytes="))
        .and_then(|r| r.split('-').next())
        .and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(0)
}

/// Запрашивает у Яндекса подписанный адрес и запоминает его.
async fn resolve<R: Runtime>(app: &AppHandle<R>, id: u64, track_id: &str) -> Result<String, String> {
    let client = app
        .state::<AppState>()
        .require()
        .await
        .map_err(|e| e.to_string())?;
    let info = client.stream_url(track_id).await.map_err(|e| e.to_string())?;
    app.state::<StreamRegistry>()
        .set_url(id, track_id, info.url.clone());
    Ok(info.url)
}

async fn serve<R: Runtime>(
    app: &AppHandle<R>,
    id: u64,
    range: Option<String>,
    is_head: bool,
) -> Result<Response<Vec<u8>>, String> {
    let (track_id, cached) = app
        .state::<StreamRegistry>()
        .get(id)
        .ok_or_else(|| "поток не найден".to_string())?;

    let fresh = app.state::<StreamRegistry>().is_fresh(id);
    let mut url = if fresh { cached } else { resolve(app, id, &track_id).await? };

    // Отдельный клиент без лишних заголовков: CDN злится на Origin и Referer.
    let http = reqwest::Client::builder()
        .gzip(false)
        .build()
        .map_err(|e| e.to_string())?;

    let start = range_start(range.as_deref());
    let want_end = start + CHUNK - 1;

    let mut attempt = 0;
    loop {
        let res = http
            .get(&url)
            .header(header::RANGE.as_str(), format!("bytes={start}-{want_end}"))
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = res.status();

        // Ссылка протухла или её отвергли — берём свежую и пробуем ещё раз.
        if matches!(status.as_u16(), 401 | 403 | 404 | 410) && attempt == 0 {
            attempt += 1;
            url = resolve(app, id, &track_id).await?;
            continue;
        }
        if !status.is_success() {
            return Err(format!("CDN ответил {status}"));
        }

        let pick = |name: reqwest::header::HeaderName| -> Option<String> {
            res.headers().get(name).and_then(|v| v.to_str().ok()).map(str::to_string)
        };
        // Яндекс отдаёт mp3 как application/octet-stream. С таким типом Chromium
        // либо отказывается играть, либо считает длительность по объёму.
        let content_type = pick(reqwest::header::CONTENT_TYPE)
            .filter(|c| c.starts_with("audio/"))
            .unwrap_or_else(|| "audio/mpeg".to_string());
        let upstream_range = pick(reqwest::header::CONTENT_RANGE);

        // Размер всего файла берём из Content-Range вида `bytes 0-99/12345`.
        let total: Option<u64> = upstream_range
            .as_deref()
            .and_then(|r| r.rsplit('/').next())
            .and_then(|t| t.trim().parse().ok());

        // Читаем тело по кускам, а не целиком: стриминговый CDN Яндекса
        // регулярно обрывает соединение на середине. Раньше это превращалось
        // в 502, и воспроизведение умирало. Теперь отдаём то, что успели —
        // Chromium просто запросит следующий диапазон.
        let mut body: Vec<u8> = Vec::new();
        if !is_head {
            let mut stream = res;
            loop {
                match stream.chunk().await {
                    Ok(Some(chunk)) => body.extend_from_slice(&chunk),
                    Ok(None) => break,
                    Err(_) => break,
                }
            }
        }

        // Совсем ничего не пришло — возможно, ссылка протухла: берём свежую
        // и пробуем ещё раз (один раз, чтобы не зациклиться).
        if !is_head && body.is_empty() && attempt == 0 {
            attempt += 1;
            url = resolve(app, id, &track_id).await?;
            continue;
        }

        let len = body.len() as u64;
        let content_range = match total {
            Some(total) if start + len <= total => {
                Some(format!("bytes {start}-{}/{total}", start + len.saturating_sub(1)))
            }
            _ => upstream_range,
        };

        let mut builder = Response::builder()
            .status(StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::OK))
            .header(header::CONTENT_TYPE, content_type)
            .header(header::ACCEPT_RANGES, "bytes")
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .header(
                header::ACCESS_CONTROL_EXPOSE_HEADERS,
                "Content-Length, Content-Range, Accept-Ranges",
            )
            .header(header::CACHE_CONTROL, "no-store");

        if let Some(cr) = content_range {
            builder = builder.header(header::CONTENT_RANGE, cr);
        }
        if !is_head {
            builder = builder.header(header::CONTENT_LENGTH, len.to_string());
        }

        return builder.body(body).map_err(|e| e.to_string());
    }
}

fn problem(status: StatusCode, message: &str) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(message.as_bytes().to_vec())
        .unwrap_or_else(|_| Response::new(Vec::new()))
}
