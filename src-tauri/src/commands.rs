//! Команды, которые вызывает фронтенд (IPC).

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::state::AppState;
use crate::ym::{
    auth,
    client::YmError,
    models::*,
    YmClient,
};

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

/// Текущий аккаунт (или None, если не авторизованы).
#[tauri::command]
pub async fn account(app: AppHandle, state: State<'_, AppState>) -> Result<Option<AccountDto>, String> {
    if state.get().await.is_none() {
        if let Some((client, account)) = auth::restore(&app).await {
            state.set(client).await;
            return Ok(Some(account));
        }
    }
    match state.get().await {
        Some(client) => match client.status().await {
            Ok(a) => Ok(Some(a)),
            Err(YmError::Unauthorized) => {
                state.clear().await;
                Ok(None)
            }
            Err(e) => Err(err(e)),
        },
        None => Ok(None),
    }
}

/// Открыть окно входа Яндекса.
#[tauri::command]
pub async fn login(app: AppHandle) -> Result<(), String> {
    // На телефоне отдельного окна нет: страницу входа открываем в основном
    // экране и сами ловим возврат с токеном.
    #[cfg(mobile)]
    {
        return crate::mobile_login::open_login(&app);
    }
    #[cfg(desktop)]
    {
        auth::open_login_window(&app)
    }
}

/// Ручной вход по токену (запасной вариант, если окно входа не сработало).
#[tauri::command]
pub async fn login_with_token(
    app: AppHandle,
    state: State<'_, AppState>,
    token: String,
) -> Result<AccountDto, String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err("Пустой токен".into());
    }
    let client = YmClient::new(token.clone(), 0).map_err(err)?;
    let account = client.status().await.map_err(err)?;
    auth::save(&app, &auth::StoredAuth { token, uid: account.uid })?;

    // Кладём клиент в состояние, чтобы следующие команды работали без входа.
    state.set(client.with_uid(account.uid)).await;
    Ok(account)
}

/// Все треки альбома.
#[tauri::command]
pub async fn album_tracks(
    state: State<'_, AppState>,
    album_id: String,
) -> Result<Vec<TrackDto>, String> {
    let client = state.require().await?;
    client.album_tracks(&album_id).await.map_err(err)
}

/// Карточка исполнителя: имя и аватар.
#[tauri::command]
pub async fn artist(state: State<'_, AppState>, artist_id: String) -> Result<ArtistDto, String> {
    let client = state.require().await?;
    client.artist(&artist_id).await.map_err(err)
}

#[tauri::command]
pub async fn logout(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    state.clear().await;
    auth::clear(&app)
}

#[tauri::command]
pub async fn playlists(state: State<'_, AppState>) -> Result<Vec<PlaylistDto>, String> {
    let client = state.require().await?;
    client.playlists().await.map_err(err)
}

#[tauri::command]
pub async fn playlist(
    state: State<'_, AppState>,
    uid: u64,
    kind: i64,
) -> Result<PlaylistDetailDto, String> {
    let client = state.require().await?;
    client.playlist(uid, kind).await.map_err(err)
}

#[tauri::command]
pub async fn search(
    state: State<'_, AppState>,
    query: String,
    page: Option<u32>,
) -> Result<SearchResultDto, String> {
    let client = state.require().await?;
    if query.trim().is_empty() {
        return Ok(SearchResultDto {
            tracks: vec![],
            albums: vec![],
            artists: vec![],
            playlists: vec![],
        });
    }
    client.search(query.trim(), page.unwrap_or(0)).await.map_err(err)
}

#[tauri::command]
pub async fn liked(state: State<'_, AppState>) -> Result<Vec<TrackDto>, String> {
    let client = state.require().await?;
    client.liked_tracks().await.map_err(err)
}

/// Треки исполнителя (открывается по клику на имя).
#[tauri::command]
pub async fn artist_tracks(
    state: State<'_, AppState>,
    artist_id: String,
    page: Option<u32>,
) -> Result<Vec<TrackDto>, String> {
    let client = state.require().await?;
    client
        .artist_tracks(&artist_id, page.unwrap_or(0))
        .await
        .map_err(err)
}

#[tauri::command]
pub async fn set_like(
    state: State<'_, AppState>,
    track_id: String,
    like: bool,
) -> Result<(), String> {
    let client = state.require().await?;
    client.set_like(&track_id, like).await.map_err(err)
}

/// Следующая пачка треков станции.
/// `station` — `user:onyourwave` (по умолчанию) или `track:{id}` для волны по треку.
/// `queue` — id последнего игравшего трека, с ним приходит продолжение цепочки.
#[tauri::command]
pub async fn wave(
    state: State<'_, AppState>,
    station: Option<String>,
    queue: Option<String>,
) -> Result<WaveBatchDto, String> {
    let client = state.require().await?;
    let station = station.unwrap_or_else(|| YmClient::WAVE_STATION.to_string());
    client.wave_tracks(&station, queue.as_deref()).await.map_err(err)
}

/// Сообщаем волне, что происходит с треком:
/// radioStarted / trackStarted / trackFinished / skip.
#[tauri::command]
pub async fn wave_feedback(
    state: State<'_, AppState>,
    station: Option<String>,
    kind: String,
    track_id: String,
    batch_id: Option<String>,
    played_seconds: Option<f64>,
) -> Result<(), String> {
    let client = state.require().await?;
    let station = station.unwrap_or_else(|| YmClient::WAVE_STATION.to_string());
    client
        .wave_feedback(&station, &kind, &track_id, batch_id.as_deref(), played_seconds)
        .await
        .map_err(err)
}

/// Текст песни: сначала спрашиваем Яндекс, если он молчит — LRCLIB.
/// Возвращает `null`, если текста нет ни там, ни там.
#[tauri::command]
pub async fn lyrics(
    state: State<'_, AppState>,
    track_id: String,
    title: String,
    artist: String,
    album: String,
    duration: f64,
) -> Result<Option<crate::lyrics::LyricsDto>, String> {
    let client = state.require().await?;
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(err)?;

    Ok(crate::lyrics::fetch(&http, &client, &track_id, &title, &artist, &album, duration).await)
}

// ─────────────────────────── Фон приложения ───────────────────────────

/// Копирует выбранный файл в папку настроек и делает его фоном.
/// Возвращает путь к копии (файл пользователя мы не трогаем и не удаляем).
#[tauri::command]
pub async fn set_wallpaper(app: AppHandle, path: String) -> Result<String, String> {
    let src = std::path::PathBuf::from(&path);
    if !src.is_file() {
        return Err("Файл не найден".into());
    }

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    const ALLOWED: [&str; 8] = ["png", "jpg", "jpeg", "webp", "gif", "avif", "mp4", "webm"];
    if !ALLOWED.contains(&ext.as_str()) {
        return Err("Подойдут картинки, GIF и видео (mp4, webm)".into());
    }

    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    // Старый фон убираем, чтобы в папке всегда лежал ровно один файл.
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let _ = std::fs::remove_file(entry.path());
        }
    }

    let dest = dir.join(format!("wallpaper.{ext}"));
    std::fs::copy(&src, &dest).map_err(|e| format!("Не удалось скопировать файл: {e}"))?;

    Ok(dest.to_string_lossy().to_string())
}

/// Убирает фон.
#[tauri::command]
pub async fn clear_wallpaper(app: AppHandle) -> Result<(), String> {
    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            std::fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Путь к текущему фону (или `null`), чтобы восстановить его при запуске.
#[tauri::command]
pub async fn wallpaper(app: AppHandle) -> Result<Option<String>, String> {
    Ok(crate::stream_proxy::wallpaper_file(&app).map(|p| p.to_string_lossy().to_string()))
}

// ─────────────────────────── Плейлисты: создание ───────────────────────────

/// Создаёт плейлист в аккаунте пользователя.
#[tauri::command]
pub async fn create_playlist(
    state: State<'_, AppState>,
    title: String,
    private: bool,
) -> Result<PlaylistDto, String> {
    let title = title.trim().to_string();
    if title.is_empty() {
        return Err("Название не может быть пустым".into());
    }
    if title.chars().count() > 100 {
        return Err("Слишком длинное название".into());
    }

    let client = state.require().await?;
    client
        .create_playlist(&title, private)
        .await
        .map_err(|e| e.to_string())
}

/// Кладёт трек в плейлист.
#[tauri::command]
pub async fn playlist_add_track(
    state: State<'_, AppState>,
    kind: i64,
    track_id: String,
    album_id: Option<String>,
) -> Result<(), String> {
    let client = state.require().await?;
    client
        .playlist_add_track(kind, &track_id, album_id.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// Переименовывает плейлист.
#[tauri::command]
pub async fn playlist_rename(
    state: State<'_, AppState>,
    kind: i64,
    title: String,
) -> Result<(), String> {
    let title = title.trim().to_string();
    if title.is_empty() {
        return Err("Название не может быть пустым".into());
    }
    let client = state.require().await?;
    client.playlist_rename(kind, &title).await.map_err(err)
}

/// Делает плейлист приватным или публичным.
#[tauri::command]
pub async fn playlist_set_visibility(
    state: State<'_, AppState>,
    kind: i64,
    private: bool,
) -> Result<(), String> {
    let client = state.require().await?;
    client.playlist_set_visibility(kind, private).await.map_err(err)
}

/// Сохраняет свою обложку плейлиста и отдаёт её как data-url.
///
/// Картинка копируется в папку настроек приложения: оригинал у человека
/// не трогаем, а обложка остаётся и после перезапуска.
#[tauri::command]
pub async fn set_playlist_cover(
    app: AppHandle,
    kind: i64,
    path: String,
) -> Result<String, String> {
    let src = std::path::PathBuf::from(&path);
    if !src.is_file() {
        return Err("Файл не найден".into());
    }

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_ascii_lowercase();
    const ALLOWED: [&str; 5] = ["png", "jpg", "jpeg", "webp", "gif"];
    if !ALLOWED.contains(&ext.as_str()) {
        return Err("Подойдут png, jpg, webp или gif".into());
    }

    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(format!("cover-{kind}.{ext}"));
    std::fs::copy(&src, &dest).map_err(|e| format!("Не удалось скопировать файл: {e}"))?;

    let bytes = std::fs::read(&dest).map_err(|e| e.to_string())?;
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    Ok(format!(
        "data:image/{ext};base64,{}",
        STANDARD.encode(bytes)
    ))
}

/// Ставит свой фон из картинки и отдаёт её как data-url.
#[tauri::command]
pub async fn set_background(app: AppHandle, path: String) -> Result<String, String> {
    let src = std::path::PathBuf::from(&path);
    if !src.is_file() {
        return Err("Файл не найден".into());
    }

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    const ALLOWED: [&str; 6] = ["png", "jpg", "jpeg", "webp", "gif", "avif"];
    if !ALLOWED.contains(&ext.as_str()) {
        return Err("Подойдут png, jpg, webp, gif или avif".into());
    }

    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    for other in ALLOWED {
        let _ = std::fs::remove_file(dir.join(format!("bg.{other}")));
    }

    let dest = dir.join(format!("bg.{ext}"));
    std::fs::copy(&src, &dest).map_err(|e| format!("Не удалось скопировать: {e}"))?;

    let bytes = std::fs::read(&dest).map_err(|e| e.to_string())?;
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    Ok(format!("data:image/{ext};base64,{}", STANDARD.encode(bytes)))
}

/// Отдаёт сохранённый фон, если он есть.
#[tauri::command]
pub async fn background(app: AppHandle) -> Result<Option<String>, String> {
    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    for ext in ["png", "jpg", "jpeg", "webp", "gif", "avif"] {
        let path = dir.join(format!("bg.{ext}"));
        if path.is_file() {
            let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
            use base64::{engine::general_purpose::STANDARD, Engine as _};
            return Ok(Some(format!(
                "data:image/{ext};base64,{}",
                STANDARD.encode(bytes)
            )));
        }
    }
    Ok(None)
}

/// Убирает свой фон.
#[tauri::command]
pub async fn clear_background(app: AppHandle) -> Result<(), String> {
    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    for ext in ["png", "jpg", "jpeg", "webp", "gif", "avif"] {
        let _ = std::fs::remove_file(dir.join(format!("bg.{ext}")));
    }
    Ok(())
}

/// Отдаёт сохранённую обложку плейлиста (если её ставили).
#[tauri::command]
pub async fn playlist_cover(app: AppHandle, kind: i64) -> Result<Option<String>, String> {
    let dir = crate::stream_proxy::wallpaper_dir(&app)?;
    for ext in ["png", "jpg", "jpeg", "webp", "gif"] {
        let path = dir.join(format!("cover-{kind}.{ext}"));
        if path.is_file() {
            let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
            use base64::{engine::general_purpose::STANDARD, Engine as _};
            return Ok(Some(format!(
                "data:image/{ext};base64,{}",
                STANDARD.encode(bytes)
            )));
        }
    }
    Ok(None)
}

/// Удаляет плейлист.
#[tauri::command]
pub async fn playlist_delete(state: State<'_, AppState>, kind: i64) -> Result<(), String> {
    let client = state.require().await?;
    client.playlist_delete(kind).await.map_err(err)
}

/// Убирает трек из плейлиста.
#[tauri::command]
pub async fn playlist_remove_track(
    state: State<'_, AppState>,
    kind: i64,
    track_id: String,
) -> Result<(), String> {
    let client = state.require().await?;
    client
        .playlist_remove_track(kind, &track_id)
        .await
        .map_err(|e| e.to_string())
}

// ─────────────────────────── Обновления ───────────────────────────

/// Откуда узнаём о новых версиях.
const RELEASES_API: &str = "https://api.github.com/repos/fizzzixs-group/coum-music/releases/latest";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    /// Версия установленного приложения.
    pub current: String,
    /// Версия последнего релиза на GitHub.
    pub latest: String,
    pub has_update: bool,
    /// Список изменений из описания релиза.
    pub notes: String,
    /// Ссылка на страницу релиза.
    pub url: String,
    pub published_at: String,
}

/// Сравниваем версии по числам: «0.10.0» новее «0.9.0».
fn version_parts(v: &str) -> Vec<u32> {
    v.trim_start_matches('v')
        .split(['.', '-', '+'])
        .map(|p| p.parse::<u32>().unwrap_or(0))
        .collect()
}

fn is_newer(latest: &str, current: &str) -> bool {
    let (a, b) = (version_parts(latest), version_parts(current));
    for i in 0..a.len().max(b.len()) {
        let (x, y) = (a.get(i).copied().unwrap_or(0), b.get(i).copied().unwrap_or(0));
        if x != y {
            return x > y;
        }
    }
    false
}

/// Спрашивает у GitHub последний релиз и говорит, стоит ли обновляться.
#[tauri::command]
pub async fn check_update() -> Result<UpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();

    let http = reqwest::Client::builder()
        .user_agent("Coum-Music")
        .build()
        .map_err(|e| e.to_string())?;

    let res = http
        .get(RELEASES_API)
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("Не удалось связаться с GitHub: {e}"))?;

    let status = res.status();
    let text = res.text().await.map_err(|e| e.to_string())?;

    if status == reqwest::StatusCode::NOT_FOUND {
        return Err("Релизов пока нет".into());
    }
    if !status.is_success() {
        return Err(format!("GitHub ответил {status}"));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Непонятный ответ GitHub: {e}"))?;

    let latest = json["tag_name"].as_str().unwrap_or("").to_string();
    let url = json["html_url"].as_str().unwrap_or("").to_string();
    let notes = json["body"].as_str().unwrap_or("").to_string();
    let published_at = json["published_at"].as_str().unwrap_or("").to_string();

    if latest.is_empty() {
        return Err("В релизе не указана версия".into());
    }

    Ok(UpdateInfo {
        has_update: is_newer(&latest, &current),
        current,
        latest,
        notes,
        url,
        published_at,
    })
}

/// Открывает ссылку в системном браузере (для ссылки на наш Telegram).
#[tauri::command]
pub async fn open_external(url: String) -> Result<(), String> {
    // Разрешаем только https — команда не должна превратиться в «запусти что угодно».
    if !url.starts_with("https://") {
        return Err("Разрешены только https-ссылки".into());
    }
    if url.contains(['"', '\'', '&', '|', '^', '<', '>']) {
        return Err("Недопустимые символы в ссылке".into());
    }

    #[cfg(windows)]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(windows))]
    {
        let opener = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
        std::process::Command::new(opener)
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Прямая ссылка на аудиопоток.
///
/// Возвращается не подписанный URL Яндекса, а локальный адрес прокси
/// (`http://coumstream.localhost/<id>`) — только так работают Web Audio,
/// эквалайзер и визуализатор. См. src/stream_proxy.rs.
#[tauri::command]
pub async fn stream(
    app: AppHandle,
    state: State<'_, AppState>,
    track_id: String,
) -> Result<StreamDto, String> {
    let client = state.require().await?;
    let info = client.stream_url(&track_id).await.map_err(err)?;

    // В реестр кладём id трека вместе с уже полученным адресом: прокси
    // возьмёт его как есть и не будет резолвить второй раз (иначе Яндекс
    // отвечает 429 Concurrency limit exceeded).
    let registry = app.state::<crate::stream_proxy::StreamRegistry>();
    let id = registry.register(track_id, info.url);

    Ok(StreamDto {
        url: crate::stream_proxy::local_url(id),
        codec: info.codec,
        bitrate: info.bitrate,
    })
}
