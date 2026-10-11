// Предотвращаем появление лишней консоли в релизной сборке Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    coum_music_lib::run()
}
