//! Авторизация: OAuth-окно Яндекса и хранение токена на диске.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use super::{client::YmClient, models::AccountDto, oauth_url};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredAuth {
    pub token: String,
    #[serde(default)]
    pub uid: u64,
}

fn token_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_config_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("session.json"))
}

pub fn load(app: &AppHandle) -> Option<StoredAuth> {
    let path = token_path(app)?;
    let raw = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

pub fn save(app: &AppHandle, auth: &StoredAuth) -> Result<(), String> {
    let path = token_path(app).ok_or("не удалось получить путь настроек")?;
    let raw = serde_json::to_string_pretty(auth).map_err(|e| e.to_string())?;
    std::fs::write(path, raw).map_err(|e| e.to_string())
}

pub fn clear(app: &AppHandle) -> Result<(), String> {
    if let Some(path) = token_path(app) {
        if path.exists() {
            std::fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Достаёт access_token из URL редиректа вида
/// `https://music.yandex.ru/#access_token=...&token_type=bearer`.
pub fn extract_token(url: &str) -> Option<String> {
    let idx = url.find("access_token=")? + "access_token=".len();
    let rest = &url[idx..];
    let end = rest.find('&').unwrap_or(rest.len());
    let token = &rest[..end];
    if token.is_empty() {
        None
    } else {
        Some(token.to_string())
    }
}

/// Открывает окно входа Яндекса. При успехе сохраняет токен и шлёт событие
/// `auth://success` с данными аккаунта.
///
/// На телефоне отдельного окна нет: система открывает браузер, а токен
/// возвращается по ссылке-редиректу. Поэтому размеры и центрирование —
/// только для десктопа.
pub fn open_login_window(app: &AppHandle) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window("login") {
        let _ = existing.close();
    }

    let url = tauri::Url::parse(&oauth_url()).map_err(|e| e.to_string())?;
    let nav_handle = app.clone();

    #[allow(unused_mut)]
    let mut builder =
        tauri::WebviewWindowBuilder::new(app, "login", tauri::WebviewUrl::External(url))
            .title("Вход в Яндекс")
            .on_navigation(move |url| {
                if let Some(token) = extract_token(url.as_str()) {
                    let handle = nav_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        finish_login(handle, token).await;
                    });
                    return false;
                }
                true
            });

    #[cfg(desktop)]
    {
        builder = builder.inner_size(560.0, 760.0).min_inner_size(420.0, 560.0).center();
    }

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}

/// Проверяет токен, сохраняет сессию, кладёт клиент в состояние и закрывает окно входа.
pub async fn finish_login(app: AppHandle, token: String) {
    match YmClient::new(token.clone(), 0) {
        Ok(client) => match client.status().await {
            Ok(account) => {
                let _ = save(&app, &StoredAuth { token, uid: account.uid });
                app.state::<crate::state::AppState>()
                    .set(client.with_uid(account.uid))
                    .await;
                let _ = app.emit("auth://success", &account);
                if let Some(w) = app.get_webview_window("login") {
                    let _ = w.close();
                }
            }
            Err(e) => {
                let _ = app.emit("auth://error", e.to_string());
            }
        },
        Err(e) => {
            let _ = app.emit("auth://error", e.to_string());
        }
    }
}

/// Собирает клиент из сохранённой сессии (если она есть).
pub async fn restore(app: &AppHandle) -> Option<(YmClient, AccountDto)> {
    let stored = load(app)?;
    let client = YmClient::new(stored.token, stored.uid).ok()?;
    match client.status().await {
        Ok(account) => Some((client.with_uid(account.uid), account)),
        Err(_) => None,
    }
}
