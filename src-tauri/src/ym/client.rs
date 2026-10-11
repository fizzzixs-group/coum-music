//! Низкоуровневый HTTP-клиент Яндекс.Музыки.
//!
//! Пути, параметры и заголовки соответствуют docs/yandex-api.md
//! (неофициальный API, собранный из MarshalX/yandex-music-api, OpenAPI-спеки
//! и yt-dlp).

use serde::de::DeserializeOwned;
use serde_json::json;

use super::models::*;
use super::API_BASE;

/// Соль для подписи ссылки на mp3 (используется всеми неофициальными клиентами).
const SIGN_SALT: &str = "XGRlBW9FXlekgbPrRHuSiA";

/// Строка клиента, которую ждёт API. Без неё часть методов отвечает отказом.
const MUSIC_CLIENT: &str = "YandexMusicAndroid/24023621";

/// Значение поля `from` в фидбеке волны.
const FEEDBACK_FROM: &str = "YandexMusicDesktopAppWindows";

#[derive(Debug, thiserror::Error)]
pub enum YmError {
    #[error("сеть недоступна: {0}")]
    Network(#[from] reqwest::Error),
    #[error("API вернул ошибку: {0}")]
    Api(String),
    #[error("неожиданный формат ответа: {0}")]
    Shape(String),
    #[error("токен не принят")]
    Unauthorized,
    #[error("трек недоступен для воспроизведения")]
    TrackUnavailable,
}

pub type Result<T> = std::result::Result<T, YmError>;

pub struct YmClient {
    http: reqwest::Client,
    token: String,
    uid: u64,
}

impl YmClient {
    pub fn new(token: impl Into<String>, uid: u64) -> Result<Self> {
        let http = reqwest::Client::builder()
            .user_agent("Yandex-Music-API")
            .gzip(true)
            .timeout(std::time::Duration::from_secs(25))
            .build()?;
        Ok(Self { http, token: token.into(), uid })
    }

    /// Тот же клиент, но с уточнённым uid (узнаём его из /account/status).
    pub fn with_uid(mut self, uid: u64) -> Self {
        self.uid = uid;
        self
    }

    fn url(&self, path: &str, query: &[(&str, String)]) -> String {
        let mut url = format!("{API_BASE}{path}");
        if !query.is_empty() {
            let qs = query
                .iter()
                .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
                .collect::<Vec<_>>()
                .join("&");
            url.push('?');
            url.push_str(&qs);
        }
        url
    }

    fn authorized(&self, method: reqwest::Method, url: &str) -> reqwest::RequestBuilder {
        self.http
            .request(method, url)
            .header("Authorization", format!("OAuth {}", self.token))
            .header("X-Yandex-Music-Client", MUSIC_CLIENT)
            .header("Accept-Language", "ru")
            .header("Accept", "application/json")
    }

    async fn request<T: DeserializeOwned>(
        &self,
        method: reqwest::Method,
        path: &str,
        query: &[(&str, String)],
        json_body: Option<serde_json::Value>,
        form_body: Option<Vec<(&'static str, String)>>,
    ) -> Result<T> {
        let mut req = self.authorized(method, &self.url(path, query));

        if let Some(b) = json_body {
            req = req.json(&b);
        }
        if let Some(f) = form_body {
            req = req.form(&f);
        }

        let res = req.send().await?;
        let status = res.status();

        if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
            return Err(YmError::Unauthorized);
        }

        let text = res.text().await?;

        if !status.is_success() {
            return Err(YmError::Api(format!("HTTP {status}: {}", truncate(&text))));
        }

        let value: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| YmError::Shape(format!("{e}: {}", truncate(&text))))?;

        if let Some(err) = value.get("error").filter(|e| !e.is_null()) {
            let name = err.get("name").and_then(|v| v.as_str()).unwrap_or("error");
            let msg = err.get("message").and_then(|v| v.as_str()).unwrap_or("");
            if name == "unauthorized" {
                return Err(YmError::Unauthorized);
            }
            return Err(YmError::Api(format!("{name}: {msg}")));
        }

        // Если `result` нет, Python-либа оборачивает в него весь корень — повторяем.
        let result = value.get("result").cloned().unwrap_or(value);
        serde_json::from_value(result).map_err(|e| YmError::Shape(e.to_string()))
    }

    async fn get<T: DeserializeOwned>(&self, path: &str, query: &[(&str, String)]) -> Result<T> {
        self.request(reqwest::Method::GET, path, query, None, None).await
    }

    /// Авторизованный GET для других модулей (например, текстов песен).
    pub async fn raw_get<T: DeserializeOwned>(
        &self,
        path: &str,
        query: &[(&str, String)],
    ) -> Result<T> {
        self.get(path, query).await
    }

    async fn post_json<T: DeserializeOwned>(
        &self,
        path: &str,
        query: &[(&str, String)],
        body: serde_json::Value,
    ) -> Result<T> {
        self.request(reqwest::Method::POST, path, query, Some(body), None).await
    }

    async fn post_form<T: DeserializeOwned>(
        &self,
        path: &str,
        query: &[(&str, String)],
        form: Vec<(&'static str, String)>,
    ) -> Result<T> {
        self.request(reqwest::Method::POST, path, query, None, Some(form)).await
    }

    // ─────────────────────────── Аккаунт ───────────────────────────

    pub async fn status(&self) -> Result<AccountDto> {
        let status: RawStatus = self.get("/account/status", &[]).await?;
        let account = status.account.unwrap_or_default();
        Ok(AccountDto {
            uid: account.uid,
            display_name: if account.display_name.is_empty() {
                account.login.clone()
            } else {
                account.display_name
            },
            login: account.login,
            avatar: account.avatar_url.map(|u| {
                if u.contains("%%") {
                    cover_url(&u, "200x200")
                } else {
                    u.replace("XX", "200x200")
                }
            }),
            has_plus: status.plus.map(|p| p.has_plus).unwrap_or(false),
        })
    }

    // ─────────────────────────── Поиск ───────────────────────────

    pub async fn search(&self, text: &str, page: u32) -> Result<SearchResultDto> {
        let raw: RawSearch = self
            .get(
                "/search",
                &[
                    ("text", text.to_string()),
                    ("type", "all".into()),
                    ("page", page.to_string()),
                    ("nocorrect", "false".into()),
                ],
            )
            .await?;

        Ok(SearchResultDto {
            tracks: raw
                .tracks
                .map(|t| t.results.iter().map(TrackDto::from).collect())
                .unwrap_or_default(),
            albums: raw
                .albums
                .map(|a| a.results.iter().map(AlbumDto::from).collect())
                .unwrap_or_default(),
            artists: raw
                .artists
                .map(|a| a.results.iter().map(ArtistDto::from).collect())
                .unwrap_or_default(),
            playlists: raw
                .playlists
                .map(|p| p.results.iter().map(|x| x.into_dto(Some(self.uid))).collect())
                .unwrap_or_default(),
        })
    }

    // ─────────────────────────── Исполнители ───────────────────────────

    /// Треки исполнителя — то, что открывается по клику на его имя.
    pub async fn artist_tracks(&self, artist_id: &str, page: u32) -> Result<Vec<TrackDto>> {
        let value: serde_json::Value = self
            .get(
                &format!("/artists/{artist_id}/tracks"),
                &[("page", page.to_string()), ("page-size", "50".into())],
            )
            .await?;

        let list = value
            .get("tracks")
            .and_then(|v| v.as_array())
            .cloned()
            .or_else(|| value.as_array().cloned())
            .unwrap_or_default();

        Ok(list
            .iter()
            .filter_map(|item| serde_json::from_value::<RawTrack>(item.clone()).ok())
            .map(|t| TrackDto::from(&t))
            .collect())
    }

    // ─────────────────────────── Плейлисты ───────────────────────────

    pub async fn playlists(&self) -> Result<Vec<PlaylistDto>> {
        let raw: Vec<RawPlaylist> = self
            .get(&format!("/users/{}/playlists/list", self.uid), &[])
            .await?;
        Ok(raw.iter().map(|p| p.into_dto(Some(self.uid))).collect())
    }

    pub async fn playlist(&self, uid: u64, kind: i64) -> Result<PlaylistDetailDto> {
        // pageSize + richTracks — чтобы треки пришли целиком, а не «короткими» ссылками.
        let raw: RawPlaylist = self
            .get(
                &format!("/users/{uid}/playlists/{kind}"),
                &[("richTracks", "true".into()), ("pageSize", "1000".into())],
            )
            .await?;

        let tracks = self.materialize(&raw.tracks).await?;
        Ok(PlaylistDetailDto { playlist: raw.into_dto(Some(self.uid)), tracks })
    }

    // ─────────────────────────── Лайки ───────────────────────────

    pub async fn liked_tracks(&self) -> Result<Vec<TrackDto>> {
        let value: RawLikesLibrary = self
            .get(&format!("/users/{}/likes/tracks", self.uid), &[])
            .await?;

        let shorts = value
            .library
            .map(|l| l.tracks)
            .filter(|t| !t.is_empty())
            .unwrap_or(value.tracks);

        let mut tracks = self.materialize(&shorts).await?;
        for t in tracks.iter_mut() {
            t.liked = true;
        }
        Ok(tracks)
    }

    /// Ставит/снимает лайк. По спецификации это form-data с `track-ids`.
    pub async fn set_like(&self, track_id: &str, like: bool) -> Result<()> {
        let action = if like { "add-multiple" } else { "remove" };
        let path = format!("/users/{}/likes/tracks/{action}", self.uid);
        let _: serde_json::Value = self
            .post_form(&path, &[], vec![("track-ids", track_id.to_string())])
            .await?;
        Ok(())
    }

    /// Дозапрашивает полные треки для «коротких» записей плейлиста, сохраняя порядок.
    async fn materialize(&self, shorts: &[RawTrackShort]) -> Result<Vec<TrackDto>> {
        let mut resolved: Vec<Option<TrackDto>> = Vec::with_capacity(shorts.len());
        let mut missing: Vec<String> = Vec::new();
        let mut missing_at: Vec<usize> = Vec::new();

        for s in shorts {
            match &s.track {
                Some(t) => resolved.push(Some(TrackDto::from(t))),
                None => {
                    resolved.push(None);
                    missing_at.push(resolved.len() - 1);
                    missing.push(s.address());
                }
            }
        }

        if missing.is_empty() {
            return Ok(resolved.into_iter().flatten().collect());
        }

        let fetched = self.tracks_by_addresses(&missing).await.unwrap_or_default();
        for (slot, address) in missing_at.into_iter().zip(missing.iter()) {
            let key = address.split(':').next().unwrap_or(address);
            if let Some(t) = fetched.get(key).or_else(|| fetched.get(address)) {
                resolved[slot] = Some(t.clone());
            }
        }

        Ok(resolved.into_iter().flatten().collect())
    }

    /// POST /tracks — пачками по 100 адресов вида `{id}` или `{id}:{albumId}`.
    async fn tracks_by_addresses(
        &self,
        addresses: &[String],
    ) -> Result<std::collections::HashMap<String, TrackDto>> {
        let mut map = std::collections::HashMap::new();
        for chunk in addresses.chunks(100) {
            let raw: Vec<RawTrack> = self
                .post_form(
                    "/tracks",
                    &[],
                    vec![
                        ("track-ids", chunk.join(",")),
                        ("with-positions", "false".to_string()),
                    ],
                )
                .await?;
            for t in raw.iter() {
                let dto = TrackDto::from(t);
                map.insert(dto.id.clone(), dto.clone());
                if !dto.album_id.is_empty() {
                    map.insert(format!("{}:{}", dto.id, dto.album_id), dto);
                }
            }
        }
        Ok(map)
    }

    // ─────────────────────────── Моя волна ───────────────────────────

    /// Станция персональной волны пользователя.
    pub const WAVE_STATION: &'static str = "user:onyourwave";

    /// Станция «волна по треку»: Яндекс сам подбирает похожее на этот трек.
    #[allow(dead_code)]
    pub fn track_station(track_id: &str) -> String {
        format!("track:{track_id}")
    }

    /// Пачка треков станции. `queue` — id последнего игравшего трека: с ним
    /// Яндекс отдаёт продолжение цепочки, а не тот же самый список заново.
    pub async fn wave_tracks(&self, station: &str, queue: Option<&str>) -> Result<WaveBatchDto> {
        let mut query: Vec<(&str, String)> = Vec::new();
        match queue {
            Some(id) => query.push(("queue", id.to_string())),
            None => query.push(("settings2", "true".to_string())),
        }

        let raw: RawWaveSequence = self
            .get(&format!("/rotor/station/{station}/tracks"), &query)
            .await?;

        let tracks = raw
            .sequence
            .iter()
            .filter_map(|item| item.track.as_ref().map(TrackDto::from))
            .collect();

        Ok(WaveBatchDto { batch_id: raw.batch_id, tracks })
    }

    /// Фидбек по треку: `trackStarted` / `trackFinished` / `skip` / `radioStarted`.
    /// `batch-id` уходит в query, остальное — в JSON-теле.
    pub async fn wave_feedback(
        &self,
        station: &str,
        kind: &str,
        track_id: &str,
        batch_id: Option<&str>,
        total_played_seconds: Option<f64>,
    ) -> Result<()> {
        let mut query: Vec<(&str, String)> = Vec::new();
        if let Some(b) = batch_id {
            query.push(("batch-id", b.to_string()));
        }

        let mut body = json!({
            "type": kind,
            "timestamp": iso8601_now(),
            "trackId": track_id,
            "from": FEEDBACK_FROM,
        });
        if let Some(s) = total_played_seconds {
            body["totalPlayedSeconds"] = json!(s);
        }

        let _: serde_json::Value = self
            .post_json(&format!("/rotor/station/{station}/feedback"), &query, body)
            .await?;
        Ok(())
    }

    // ─────────────────────────── Поток ───────────────────────────

    /// Возвращает прямую ссылку на mp3 для плеера.
    ///
    /// Схема: `/tracks/{id}/download-info` → XML (host/path/ts/s) →
    /// `sign = md5(SALT + path[1:] + s)` → `https://{host}/get-mp3/{sign}/{ts}{path}`.
    pub async fn stream_url(&self, track_id: &str) -> Result<StreamDto> {
        let infos: Vec<RawDownloadInfo> = self
            .get(&format!("/tracks/{track_id}/download-info"), &[])
            .await
            .map_err(|_| YmError::TrackUnavailable)?;

        // Берём только mp3 (aac в неофициальных клиентах не используется) и по убыванию битрейта.
        let mut candidates: Vec<&RawDownloadInfo> = infos
            .iter()
            .filter(|i| i.codec == "mp3" && !i.download_info_url.is_empty())
            .collect();
        candidates.sort_by_key(|i| std::cmp::Reverse(i.bitrate_in_kbps));

        for info in candidates {
            let xml = self
                .http
                .get(&info.download_info_url)
                .send()
                .await?
                .text()
                .await?;

            let (host, path, ts, s) = match (
                extract_tag(&xml, "host"),
                extract_tag(&xml, "path"),
                extract_tag(&xml, "ts"),
                extract_tag(&xml, "s"),
            ) {
                (Some(h), Some(p), Some(t), Some(s)) => (h, p, t, s),
                _ => continue,
            };

            let sign = md5_hex(&format!("{SIGN_SALT}{}{s}", path.trim_start_matches('/')));
            let url = format!("https://{host}/get-mp3/{sign}/{ts}{path}");

            // Намеренно без проверки ссылки пробным запросом: лишний round-trip
            // заметно тормозит переключение треков. Если ссылка окажется битой,
            // прокси сам перезапросит её при ошибке CDN.
            return Ok(StreamDto {
                url,
                codec: info.codec.clone(),
                bitrate: info.bitrate_in_kbps,
            });
        }

        Err(YmError::TrackUnavailable)
    }
}

fn truncate(s: &str) -> String {
    s.chars().take(300).collect()
}

fn extract_tag(xml: &str, tag: &str) -> Option<String> {
    let open = format!("<{tag}>");
    let close = format!("</{tag}>");
    let start = xml.find(&open)? + open.len();
    let end = xml[start..].find(&close)? + start;
    Some(xml[start..end].trim().to_string())
}

fn md5_hex(input: &str) -> String {
    use md5::{Digest, Md5};
    let digest = Md5::digest(input.as_bytes());
    digest.iter().map(|b| format!("{b:02x}")).collect()
}

/// Текущее время в ISO8601 с миллисекундами — формат поля `timestamp` в фидбеке.
fn iso8601_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs() as i64;
    let millis = now.subsec_millis();

    let days = secs.div_euclid(86_400);
    let sod = secs.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);

    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{millis:03}Z",
        sod / 3600,
        (sod % 3600) / 60,
        sod % 60
    )
}

/// Дни от 1970-01-01 → (год, месяц, день). Алгоритм Говарда Хиннанта.
fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as i64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}
