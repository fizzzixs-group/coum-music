//! Вход по аккаунту на телефоне.
//!
//! На Android отдельное окно входа не работает (система не умеет открывать
//! второе окно внутри приложения), поэтому страницу Яндекса открываем в
//! основном экране. Когда после входа браузер переходит на адрес с токеном,
//! мы перехватываем этот переход, сохраняем сессию и возвращаем приложение.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Адрес приложения внутри Android-вьюхи — на него возвращаемся после входа.
const APP_URL: &str = "http://tauri.localhost/index.html";

/// Создаёт главное окно с перехватом возврата после входа.
///
/// Окно собираем сами, а не из конфига: только так можно повесить обработчик
/// навигации, который и ловит токен.
pub fn start_main_webview(app: AppHandle) -> tauri::Result<()> {
    // Если окно уже создано конфигом — второй раз не создаём.
    if app.get_webview_window("main").is_some() {
        return Ok(());
    }

    let nav_app = app.clone();

    WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("index.html".into()))
        .on_navigation(move |url| {
            let Some(token) = crate::ym::auth::extract_token(url.as_str()) else {
                return true;
            };

            let handle = nav_app.clone();
            tauri::async_runtime::spawn(async move {
                crate::ym::auth::finish_login(handle.clone(), token).await;

                // Возвращаемся в приложение: страница Яндекса больше не нужна.
                if let Some(win) = handle.get_webview_window("main") {
                    if let Ok(url) = tauri::Url::parse(APP_URL) {
                        let _ = win.navigate(url);
                    }
                }
            });

            // Переход на music.yandex.ru не пускаем — токен уже забрали.
            false
        })
        .build()?;

    Ok(())
}

/// Открывает страницу входа в основном окне.
pub fn open_login(app: &AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or_else(|| "окно приложения не найдено".to_string())?;

    let url = tauri::Url::parse(&crate::ym::oauth_url()).map_err(|e| e.to_string())?;
    win.navigate(url).map_err(|e| e.to_string())
}
