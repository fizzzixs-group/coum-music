//! Разбор ответов API и приведение их к компактным DTO для фронтенда.
//!
//! Структуры намеренно «терпимые»: все поля необязательные, чтобы изменения
//! на стороне Яндекса не роняли приложение целиком. Спецификация — docs/yandex-api.md.

use serde::{Deserialize, Serialize};

// ─────────────────────────── DTO для фронтенда ───────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistRef {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackDto {
    pub id: String,
    /// id альбома: Яндекс адресует треки парой `{id}:{albumId}` (лайки, rotor-фидбек).
    pub album_id: String,
    pub title: String,
    pub artists: String,
    /// Исполнители с id — по имени можно перейти к их трекам.
    pub artist_list: Vec<ArtistRef>,
    pub album: String,
    pub duration_ms: u64,
    pub cover: Option<String>,
    pub available: bool,
    pub liked: bool,
    pub explicit: bool,
}

impl TrackDto {
    /// Идентификатор в формате, который понимает rotor и API лайков.
    #[allow(dead_code)]
    pub fn rotor_id(&self) -> String {
        if self.album_id.is_empty() {
            self.id.clone()
        } else {
            format!("{}:{}", self.id, self.album_id)
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlbumDto {
    pub id: String,
    pub title: String,
    pub artists: String,
    pub cover: Option<String>,
    pub track_count: u32,
    pub year: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtistDto {
    pub id: String,
    pub name: String,
    pub cover: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistDto {
    pub kind: i64,
    pub uid: u64,
    pub title: String,
    pub description: Option<String>,
    pub cover: Option<String>,
    pub track_count: u32,
    pub owner_name: String,
    pub is_mine: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistDetailDto {
    pub playlist: PlaylistDto,
    pub tracks: Vec<TrackDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultDto {
    pub tracks: Vec<TrackDto>,
    pub albums: Vec<AlbumDto>,
    pub artists: Vec<ArtistDto>,
    pub playlists: Vec<PlaylistDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WaveBatchDto {
    pub batch_id: Option<String>,
    pub tracks: Vec<TrackDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountDto {
    pub uid: u64,
    pub display_name: String,
    pub login: String,
    pub avatar: Option<String>,
    pub has_plus: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamDto {
    pub url: String,
    pub codec: String,
    pub bitrate: u32,
}

// ───────────────────────── Сырые структуры API ─────────────────────────

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawCover {
    #[serde(default)]
    pub uri: Option<String>,
    #[serde(default)]
    #[allow(dead_code)]
    pub items_uri: Option<Vec<String>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawArtist {
    #[serde(default, deserialize_with = "de_string")]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub cover: Option<RawCover>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAlbum {
    #[serde(default, deserialize_with = "de_string")]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub cover_uri: Option<String>,
    #[serde(default)]
    pub year: Option<u32>,
    #[serde(default)]
    pub track_count: Option<u32>,
    #[serde(default)]
    pub artists: Vec<RawArtist>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTrack {
    #[serde(default, deserialize_with = "de_string")]
    pub id: String,
    #[serde(default, deserialize_with = "de_string")]
    pub real_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub available: bool,
    #[serde(default)]
    pub explicit: bool,
    #[serde(default)]
    pub duration_ms: u64,
    #[serde(default)]
    pub cover_uri: Option<String>,
    #[serde(default)]
    pub artists: Vec<RawArtist>,
    #[serde(default)]
    pub albums: Vec<RawAlbum>,
}

/// Элемент списка треков плейлиста / избранного (TrackShort):
/// `{ id, albumId, timestamp, playCount, track? }`. Вложенный `track` приходит
/// только в «rich»-выдаче, иначе трек нужно дозапрашивать пачкой.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawTrackShort {
    #[serde(default, deserialize_with = "de_string")]
    pub id: String,
    #[serde(default, deserialize_with = "de_string")]
    pub album_id: String,
    #[serde(default)]
    pub track: Option<RawTrack>,
}

impl RawTrackShort {
    /// `{id}:{albumId}` — так трек адресуется в API.
    pub fn address(&self) -> String {
        if self.album_id.is_empty() {
            self.id.clone()
        } else {
            format!("{}:{}", self.id, self.album_id)
        }
    }
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawOwner {
    #[serde(default)]
    pub uid: u64,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub login: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPlaylist {
    #[serde(default)]
    pub kind: i64,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub cover: Option<RawCover>,
    #[serde(default)]
    pub og_image: Option<String>,
    #[serde(default)]
    pub track_count: u32,
    #[serde(default)]
    pub owner: Option<RawOwner>,
    #[serde(default)]
    pub tracks: Vec<RawTrackShort>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawAccount {
    #[serde(default)]
    pub uid: u64,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub login: String,
    #[serde(default)]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawStatus {
    #[serde(default)]
    pub account: Option<RawAccount>,
    #[serde(default)]
    pub plus: Option<RawPlus>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPlus {
    #[serde(default)]
    pub has_plus: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSearch {
    #[serde(default)]
    pub tracks: Option<RawPaged<RawTrack>>,
    #[serde(default)]
    pub albums: Option<RawPaged<RawAlbum>>,
    #[serde(default)]
    pub artists: Option<RawPaged<RawArtist>>,
    #[serde(default)]
    pub playlists: Option<RawPaged<RawPlaylist>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawPaged<T> {
    #[serde(default)]
    pub results: Vec<T>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawWaveSequence {
    #[serde(default)]
    pub sequence: Vec<RawWaveItem>,
    #[serde(default)]
    pub batch_id: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawWaveItem {
    #[serde(default)]
    pub track: Option<RawTrack>,
    #[serde(default)]
    #[allow(dead_code)]
    pub liked: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawDownloadInfo {
    #[serde(default)]
    pub codec: String,
    /// В API поле называется bitrateInKbps; `bitrate` — на случай других сборок.
    #[serde(default, alias = "bitrate")]
    pub bitrate_in_kbps: u32,
    #[serde(default)]
    pub download_info_url: String,
    #[serde(default)]
    #[allow(dead_code)]
    pub direct: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawLikesLibrary {
    #[serde(default)]
    pub library: Option<RawLikesTracks>,
    #[serde(default)]
    pub tracks: Vec<RawTrackShort>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawLikesTracks {
    #[serde(default)]
    pub tracks: Vec<RawTrackShort>,
}

// ─────────────────────────── Преобразования ───────────────────────────

/// Яндекс иногда отдаёт id числом, иногда строкой — приводим к строке.
fn de_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::Deserialize;
    let value = serde_json::Value::deserialize(deserializer)?;
    Ok(match value {
        serde_json::Value::String(s) => s,
        serde_json::Value::Number(n) => n.to_string(),
        _ => String::new(),
    })
}

/// Из `avatars.yandex.net/get-music-content/.../%%` делает готовый URL нужного размера.
pub fn cover_url(uri: &str, size: &str) -> String {
    if uri.starts_with("http") {
        return uri.to_string();
    }
    let path = uri.replace("%%", size);
    format!("https://{path}")
}

fn pick_cover(track: &RawTrack) -> Option<String> {
    track
        .cover_uri
        .as_deref()
        .map(|u| cover_url(u, "400x400"))
        .or_else(|| {
            track
                .albums
                .first()
                .and_then(|a| a.cover_uri.as_deref())
                .map(|u| cover_url(u, "400x400"))
        })
}

impl From<&RawTrack> for TrackDto {
    fn from(t: &RawTrack) -> Self {
        let artists = if t.artists.is_empty() {
            "Неизвестный исполнитель".to_string()
        } else {
            t.artists
                .iter()
                .map(|a| a.name.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        };
        let album = t.albums.first();
        TrackDto {
            id: if t.id.is_empty() { t.real_id.clone() } else { t.id.clone() },
            album_id: album.map(|a| a.id.clone()).unwrap_or_default(),
            title: if t.title.is_empty() { "Без названия".into() } else { t.title.clone() },
            artists,
            artist_list: t
                .artists
                .iter()
                .filter(|a| !a.id.is_empty())
                .map(|a| ArtistRef { id: a.id.clone(), name: a.name.clone() })
                .collect(),
            album: album.map(|a| a.title.clone()).unwrap_or_default(),
            duration_ms: t.duration_ms,
            cover: pick_cover(t),
            available: t.available,
            liked: false,
            explicit: t.explicit,
        }
    }
}

impl From<&RawAlbum> for AlbumDto {
    fn from(a: &RawAlbum) -> Self {
        AlbumDto {
            id: a.id.clone(),
            title: a.title.clone(),
            artists: a
                .artists
                .iter()
                .map(|x| x.name.as_str())
                .collect::<Vec<_>>()
                .join(", "),
            cover: a.cover_uri.as_deref().map(|u| cover_url(u, "400x400")),
            track_count: a.track_count.unwrap_or(0),
            year: a.year,
        }
    }
}

impl From<&RawArtist> for ArtistDto {
    fn from(a: &RawArtist) -> Self {
        ArtistDto {
            id: a.id.clone(),
            name: a.name.clone(),
            cover: a
                .cover
                .as_ref()
                .and_then(|c| c.uri.as_deref())
                .map(|u| cover_url(u, "400x400")),
        }
    }
}

impl RawPlaylist {
    pub fn into_dto(&self, my_uid: Option<u64>) -> PlaylistDto {
        let uid = self.owner.as_ref().map(|o| o.uid).unwrap_or(0);
        let owner_name = self
            .owner
            .as_ref()
            .and_then(|o| o.name.clone().or_else(|| o.login.clone()))
            .unwrap_or_else(|| "Яндекс.Музыка".into());
        PlaylistDto {
            kind: self.kind,
            uid,
            title: if self.title.is_empty() { "Плейлист".into() } else { self.title.clone() },
            description: self.description.clone().filter(|d| !d.is_empty()),
            cover: self
                .cover
                .as_ref()
                .and_then(|c| c.uri.as_deref())
                .map(|u| cover_url(u, "400x400"))
                .or_else(|| self.og_image.clone()),
            track_count: self.track_count,
            owner_name,
            is_mine: my_uid.map(|u| u == uid).unwrap_or(false),
        }
    }
}
