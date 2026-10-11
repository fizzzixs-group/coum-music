//! Тексты песен.
//!
//! Два источника, по очереди:
//!  1. Яндекс (`/tracks/{id}/lyrics`) — родной источник с синхронным текстом.
//!     Требует подписи: `sign = base64(hmac_sha256(key, numericId + timeStamp))`,
//!     причём ключ жёстко привязан к заголовку `X-Yandex-Music-Client`.
//!     На момент написания Яндекс отдаёт 404 на все треки (сбой на их стороне),
//!     но код готов к возвращению функциональности.
//!  2. LRCLIB (lrclib.net) — открытая база синхронных текстов, работает сейчас.
//!
//! Разбор LRC: строки вида `[00:12.34] текст`, теги `[ar:...]` пропускаем.

use std::time::{SystemTime, UNIX_EPOCH};

use hmac::{Hmac, Mac};
use base64::Engine as _;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

/// Ключ подписи текстов для Android-клиента (не путать с ключом get-file-info).
const LYRICS_KEY: &str = "p93jhgh689SBReK6ghtw62";

/// LRCLIB просит представляться — иначе отвечает 400.
const USER_AGENT: &str = "Coum Music/0.1.0 (https://t.me/coumfun)";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsLine {
    /// Время начала строки в секундах. `None` — текст без таймингов.
    pub time: Option<f64>,
    pub text: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsDto {
    /// Есть ли тайминги: только тогда строки подсвечиваются по ходу трека.
    pub synced: bool,
    pub lines: Vec<LyricsLine>,
    /// Откуда взяли текст — для отладки и честности перед пользователем.
    pub source: String,
}

/// Достаёт текст: сначала пробуем Яндекс, потом LRCLIB.
pub async fn fetch(
    http: &reqwest::Client,
    ym: &crate::ym::YmClient,
    track_id: &str,
    title: &str,
    artist: &str,
    album: &str,
    duration: f64,
) -> Option<LyricsDto> {
    if let Some(lyrics) = from_yandex(http, ym, track_id).await {
        return Some(lyrics);
    }
    from_lrclib(http, title, artist, album, duration).await
}

// ─────────────────────────── Яндекс ───────────────────────────

fn numeric_id(track_id: &str) -> &str {
    track_id.split(':').next().unwrap_or(track_id)
}

fn sign(track_id: &str, timestamp: u64) -> String {
    let message = format!("{}{}", numeric_id(track_id), timestamp);
    let mut mac = Hmac::<Sha256>::new_from_slice(LYRICS_KEY.as_bytes())
        .expect("любая длина ключа допустима");
    mac.update(message.as_bytes());
    // Паддинг оставляем: сервер ждёт обычный base64.
    base64::engine::general_purpose::STANDARD.encode(mac.finalize().into_bytes())
}

#[derive(Debug, Deserialize)]
struct YandexLyricsResult {
    lyrics: Option<YandexLyrics>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct YandexLyrics {
    download_url: Option<String>,
}

async fn from_yandex(
    http: &reqwest::Client,
    ym: &crate::ym::YmClient,
    track_id: &str,
) -> Option<LyricsDto> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()?
        .as_secs();
    let sign = sign(track_id, timestamp);
    let numeric = numeric_id(track_id).to_string();

    let result: YandexLyricsResult = ym
        .raw_get(
            &format!("/tracks/{numeric}/lyrics"),
            &[
                ("format", "LRC".to_string()),
                ("timeStamp", timestamp.to_string()),
                ("sign", sign),
            ],
        )
        .await
        .ok()?;

    let url = result.lyrics?.download_url?;
    let text = http.get(url).send().await.ok()?.text().await.ok()?;
    let lines = parse_lrc(&text);
    if lines.is_empty() {
        return None;
    }
    Some(LyricsDto {
        synced: lines.iter().any(|l| l.time.is_some()),
        lines,
        source: "Яндекс".into(),
    })
}

// ─────────────────────────── LRCLIB ───────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LrclibTrack {
    /// Приходит в ответе, но для разбора текста не нужен.
    #[serde(default)]
    #[allow(dead_code)]
    track_name: String,
    #[serde(default)]
    artist_name: String,
    #[serde(default)]
    duration: Option<f64>,
    #[serde(default)]
    instrumental: bool,
    #[serde(default)]
    plain_lyrics: Option<String>,
    #[serde(default)]
    synced_lyrics: Option<String>,
}

async fn from_lrclib(
    http: &reqwest::Client,
    title: &str,
    artist: &str,
    album: &str,
    duration: f64,
) -> Option<LyricsDto> {
    if title.trim().is_empty() {
        return None;
    }

    let duration_arg = if duration > 1.0 { format!("{}", duration.round() as i64) } else { String::new() };

    // 1. Точное совпадение — самый надёжный путь.
    let exact = http
        .get("https://lrclib.net/api/get")
        .header("User-Agent", USER_AGENT)
        .query(&[
            ("track_name", title),
            ("artist_name", artist),
            ("album_name", album),
            ("duration", duration_arg.as_str()),
        ])
        .send()
        .await;

    if let Ok(res) = exact {
        if res.status().is_success() {
            if let Ok(track) = res.json::<LrclibTrack>().await {
                if let Some(dto) = to_dto(&track) {
                    return Some(dto);
                }
            }
        }
    }

    // 2. Поиск: берём ближайший по длительности неинструментальный вариант.
    let found = http
        .get("https://lrclib.net/api/search")
        .header("User-Agent", USER_AGENT)
        .query(&[("track_name", title), ("artist_name", artist)])
        .send()
        .await
        .ok()?;

    if !found.status().is_success() {
        return None;
    }
    let mut candidates: Vec<LrclibTrack> = found.json().await.ok()?;
    candidates.retain(|c| !c.instrumental && (c.synced_lyrics.is_some() || c.plain_lyrics.is_some()));
    candidates.sort_by_key(|c| {
        let diff = match c.duration {
            Some(d) if duration > 1.0 => (d - duration).abs(),
            _ => f64::MAX,
        };
        (diff * 1000.0) as i64
    });

    candidates.first().and_then(to_dto)
}

fn to_dto(track: &LrclibTrack) -> Option<LyricsDto> {
    if let Some(lrc) = track.synced_lyrics.as_deref().filter(|s| !s.trim().is_empty()) {
        let lines = parse_lrc(lrc);
        if !lines.is_empty() {
            return Some(LyricsDto {
                synced: true,
                lines,
                source: format!("LRCLIB · {}", track.artist_name),
            });
        }
    }

    let plain = track.plain_lyrics.as_deref().filter(|s| !s.trim().is_empty())?;
    let lines: Vec<LyricsLine> = plain
        .lines()
        .map(|l| LyricsLine { time: None, text: l.trim_end().to_string() })
        .collect();
    if lines.is_empty() {
        return None;
    }
    Some(LyricsDto { synced: false, lines, source: "LRCLIB".into() })
}

// ─────────────────────────── Разбор LRC ───────────────────────────

/// Разбирает LRC в список строк. Теги вида `[ar:...]` и пустые строки пропускаем.
pub fn parse_lrc(text: &str) -> Vec<LyricsLine> {
    let mut out = Vec::new();

    for raw in text.lines() {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            continue;
        }

        let mut rest = trimmed;
        let mut times: Vec<f64> = Vec::new();

        // В одной строке может стоять несколько меток времени подряд.
        while rest.starts_with('[') {
            let Some(end) = rest.find(']') else { break };
            let tag = &rest[1..end];
            match parse_timestamp(tag) {
                Some(seconds) => times.push(seconds),
                // Тег метаданных ([ar:...], [offset:...]) просто выбрасываем.
                None => {}
            }
            rest = &rest[end + 1..];
        }

        let content = rest.trim();
        if times.is_empty() {
            if !content.is_empty() {
                out.push(LyricsLine { time: None, text: content.to_string() });
            }
            continue;
        }

        for t in times {
            out.push(LyricsLine { time: Some(t), text: content.to_string() });
        }
    }

    // Строки с таймингами должны идти по порядку — иначе подсветка прыгает.
    if out.iter().any(|l| l.time.is_some()) {
        out.sort_by(|a, b| match (a.time, b.time) {
            (Some(x), Some(y)) => x.partial_cmp(&y).unwrap_or(std::cmp::Ordering::Equal),
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, None) => std::cmp::Ordering::Equal,
        });
    }

    out
}

/// `mm:ss.xx` или `mm:ss` → секунды.
fn parse_timestamp(tag: &str) -> Option<f64> {
    let (minutes, rest) = tag.split_once(':')?;
    let minutes: f64 = minutes.trim().parse().ok()?;
    let seconds: f64 = rest.trim().parse().ok()?;
    if !seconds.is_finite() || seconds < 0.0 {
        return None;
    }
    Some(minutes * 60.0 + seconds)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_synced_lines() {
        let lrc = "[ar:Someone]\n[00:12.34] Первая строка\n[00:20.00][01:05.50] Повтор\n";
        let lines = parse_lrc(lrc);
        assert_eq!(lines.len(), 3);
        assert!((lines[0].time.unwrap() - 12.34).abs() < 0.001);
        assert_eq!(lines[0].text, "Первая строка");
        assert!((lines[1].time.unwrap() - 20.0).abs() < 0.001);
        assert!((lines[2].time.unwrap() - 65.5).abs() < 0.001);
    }

    #[test]
    fn keeps_plain_text() {
        let lines = parse_lrc("Просто текст\n\nЕщё строка");
        assert_eq!(lines.len(), 2);
        assert!(lines.iter().all(|l| l.time.is_none()));
    }

    /// Проверка живого источника. Запуск: cargo test --lib -- --ignored
    #[tokio::test]
    #[ignore = "ходит в сеть"]
    async fn lrclib_gives_synced_lyrics() {
        let http = reqwest::Client::new();
        let dto = from_lrclib(&http, "Blinding Lights", "The Weeknd", "After Hours", 200.0).await;
        let dto = dto.expect("текст должен найтись");
        assert!(dto.synced, "ожидался синхронный текст");
        assert!(dto.lines.len() > 5, "строк подозрительно мало: {}", dto.lines.len());
        assert!(dto.lines.iter().any(|l| l.time.is_some()));
    }
}
