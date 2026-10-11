//! Клиент неофициального API Яндекс.Музыки.
//!
//! Весь обмен с api.music.yandex.net идёт из Rust (в обход CORS WebView),
//! токен никогда не покидает процесс приложения.

pub mod auth;
pub mod client;
pub mod models;

pub use client::YmClient;

/// Базовый хост API Яндекс.Музыки.
pub const API_BASE: &str = "https://api.music.yandex.net";

/// client_id неофициального мобильного клиента Яндекс.Музыки — по нему
/// oauth.yandex.ru отдаёт токен в редиректе (#access_token=...).
pub const OAUTH_CLIENT_ID: &str = "23cabbbdc6cd418abb4b39c32c41195d";

/// Адрес страницы авторизации.
pub fn oauth_url() -> String {
    format!(
        "https://oauth.yandex.ru/authorize?response_type=token&client_id={}",
        OAUTH_CLIENT_ID
    )
}
