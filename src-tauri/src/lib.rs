//! Coum Music — точка сборки Tauri-приложения.

mod commands;
mod lyrics;
mod state;
mod stream_proxy;
mod ym;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .manage(stream_proxy::StreamRegistry::default())
        // Аудио идёт через локальную схему: так работают эквалайзер и визуализатор.
        .register_asynchronous_uri_scheme_protocol(stream_proxy::SCHEME, stream_proxy::handle)
        .invoke_handler(tauri::generate_handler![
            commands::account,
            commands::login,
            commands::login_with_token,
            commands::logout,
            commands::playlists,
            commands::playlist,
            commands::search,
            commands::liked,
            commands::artist_tracks,
            commands::set_like,
            commands::wave,
            commands::wave_feedback,
            commands::stream,
            commands::lyrics,
            commands::open_external,
            commands::set_wallpaper,
            commands::clear_wallpaper,
            commands::wallpaper,
        ])
        .run(tauri::generate_context!())
        .expect("не удалось запустить Coum Music");
}
