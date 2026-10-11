//! Команды, которые вызывает фронтенд (IPC).

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
    auth::open_login_window(&app)
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
    state.set(client.with_uid(account.uid)).await;
    Ok(account)
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

    // В реестр кладём именно id трека: прокси сам резолвит подписанный адрес
    // и перезапрашивает его, когда ссылка протухает.
    let registry = app.state::<crate::stream_proxy::StreamRegistry>();
    let id = registry.register(track_id);

    Ok(StreamDto {
        url: crate::stream_proxy::local_url(id),
        codec: info.codec,
        bitrate: info.bitrate,
    })
}
