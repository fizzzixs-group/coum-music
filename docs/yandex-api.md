# Неофициальный API Яндекс.Музыки (`api.music.yandex.net`) — техническая спецификация

Конспект для реализации HTTP-клиента (Rust/reqwest).
Составлен по исходникам эталонных неофициальных клиентов; для каждого утверждения указан источник.
Там, где источники не подтверждают факт, прямо написано **«не подтверждено»**.

## Источники

**Python-библиотека `MarshalX/yandex-music-api` (main):**

- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/client.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/account.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/search.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/playlists.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/likes.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/tracks.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/radio.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/rotor_sessions.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/wave.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/device_auth.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client/_batch.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/_client_base.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/utils/request_base.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/utils/request.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/utils/sign_request.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/utils/decrypt.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/utils/convert_track_id.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/download_info.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/track/track.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/track/file_download_info.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/track/file_info.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/track_short.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/tracks_list.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/cover.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/playlist/playlist.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/account/status.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/account/account.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/account/plus.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/account/permissions.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/search/search.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/search/search_result.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/station_tracks_result.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/sequence.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/dashboard.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/station_result.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/id.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/session_event.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/generative_stream.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/generative_stream_info.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/rotor/generative_stream_feedback.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/yandex_music/exceptions.py`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/README.md`
- `https://raw.githubusercontent.com/MarshalX/yandex-music-api/main/docs/source/token.md` (то же, что `https://ym.marshal.dev/token`)
- `https://ym.marshal.dev/yandex_music.download_info/`

**Rust-крейт `yandex-music` (docs.rs, `latest`):**

- `https://docs.rs/yandex-music/latest/src/yandex_music/lib.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/client/builder.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/client/request.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/api/mod.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/api/track/get_download_info.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/api/playlist/get_playlist.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/api/rotor/get_station_tracks.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/api/rotor/send_station_feedback.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/model/info/download_info.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/model/rotor/station.rs.html`
- `https://docs.rs/yandex-music/latest/src/yandex_music/model/rotor/feedback.rs.html`

**OpenAPI-спека (неофициальная, `acherkashin/yandex-music-open-api`):**

- `https://raw.githubusercontent.com/acherkashin/yandex-music-open-api/main/src/yandex-music.yaml`

**Прочие реальные клиенты:**

- yt-dlp: `https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/yt_dlp/extractor/yandexmusic.py`
- Music Assistant (провайдер `yandex_music`): `https://raw.githubusercontent.com/music-assistant/server/dev/music_assistant/providers/yandex_music/constants.py`, `.../api_client.py`, PR `https://github.com/music-assistant/server/pull/4011`

---

## 0. Общая модель API

### 0.1. Базовый URL

- `https://api.music.yandex.net` — `client.py`:
  `if base_url is None: base_url = 'https://api.music.yandex.net'`.
- Rust: `pub const API_PATH: &str = "https://api.music.yandex.net:443/";` — `api/lib.rs`.
  Пути в Rust-крейте склеиваются как `format!("{}{}", API_PATH, endpoint.path())`, где `path()` возвращает путь **без ведущего слэша** (например `"tracks/{id}/download-info"`).
- OpenAPI объявляет серверы `https://api.music.yandex.net:443/` и `http://api.music.yandex.net:443/` (а также CORS-прокси `https://yandex-music-cors-proxy.onrender.com/...`).

### 0.2. Формат ответа

Любой JSON-ответ обёрнут:

```json
{
  "invocationInfo": { "exec-duration-millis": 12, "hostname": "...", "req-id": "...", "app-name": "..." },
  "result": { },
  "error": { "name": "...", "message": "..." }
}
```

- `InvocationInfo` (`exec-duration-millis`, `hostname`, `req-id`, `app-name`) — OpenAPI, `components.schemas.InvocationInfo`; Rust `api/mod.rs` (`#[serde(rename_all = "kebab-case")]`).
- `Response { invocation_info, result, error }` — Rust `api/mod.rs`.
- Python нормализует ключи camelCase → snake_case (`utils/normalize.py`, вызывается в `_parse`/`cleanup_data`). Т.е. в JSON на проводе — **camelCase**, библиотека внутри работает со snake_case. При реализации клиента на Rust нужно ориентироваться на camelCase из ответов.

### 0.3. Заголовки, отправляемые клиентами

`utils/request_base.py`:

```python
USER_AGENT = 'Yandex-Music-API'
HEADERS = {
    'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
}
DEFAULT_TIMEOUT = 5
```

- На каждый запрос Python-клиент добавляет `User-Agent: Yandex-Music-API` (`_prepare_kwargs`).
- `Accept-Language: <lang>` добавляется, если вызван `set_language` (значения: `en/uz/uk/us/ru/kk/hy`; по умолчанию `ru`).
- `Authorization: OAuth <token>` — `set_authorization` (`utils/request_base.py`).
- Rust-крейт по умолчанию ставит ровно два заголовка (`client/builder.rs`): `Authorization: OAuth {token}` и `X-Yandex-Music-Client: {client_id}`, где `DEFAULT_CLIENT_ID = "YandexMusicAndroid/24023621"` (`lib.rs`).
- `Content-Type: application/json` ставится автоматически при передаче `json=`/`with_json_data` (`_prepare_kwargs`; Rust `RequestBody::Json` → `reqwest` `.json()`).
- Дефолтный таймаут — **5 секунд** на запрос (`DEFAULT_TIMEOUT = 5`).

### 0.4. Методы получения сущностей «пачкой»

`_client/_batch.py` (`_BatchMixin._get_list`) — используется для треков/альбомов/артистов/плейлистов:

```python
params.update({f'{object_type}-ids': ids})
url = f'{self.base_url}/{object_type}s' + ('/list' if object_type == 'playlist' else '')
result = self._request.post(url, params, *args, **kwargs)
```

Т.е.:
- `POST /tracks` (form-encoded `track-ids=...`), `POST /albums` (`album-ids=...`), `POST /artists` (`artist-ids=...`), `POST /playlists/list` (`playlist-ids=...`).
- `GetTracksOptions` в OpenAPI: `POST /tracks/`.
- Python `client.tracks(ids, with_positions=True)` добавляет к форме параметр `with-positions=true` (`_client/tracks.py`).

---

## A. Авторизация

### A.1. OAuth URL (implicit flow), client_id неофициального клиента

Источник: `docs/source/token.md` = `https://ym.marshal.dev/token`, раздел «Через браузер (implicit OAuth)».

Точный URL:

```
https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d
```

Редирект приходит на:

```
https://music.yandex.ru/#access_token=AQAAAAYc***&token_type=bearer&expires_in=31535645
```

- Токен лежит **во фрагменте URL** (`#access_token=...`), а не в query-параметрах.
- Токен = значение параметра `access_token`. Рядом `token_type=bearer` и `expires_in` (секунды).
- `client_id` = `23cabbbdc6cd418abb4b39c32c41195d` — это публичный client_id официального Android-приложения Яндекс.Музыки (`_client/device_auth.py`: `_DEFAULT_CLIENT_ID = '23cabbbdc6cd418abb4b39c32c41195d'`).
- `client_secret` того же приложения: `53bc75238f0c4d08a118e51fe9203300` (`_client/device_auth.py`).
- В документированном URL **нет** параметра `redirect_uri`. Создать своё OAuth-приложение нельзя — в `token.md` прямо: «**Своё OAuth-приложение создать нельзя.**» Какой именно `redirect_uri` зарегистрирован у этого client_id — **не подтверждено**.
- Другие способы получения токена (расширения браузера, APK, сайт) перечислены в `token.md`, но к HTTP API отношения не имеют.

### A.2. Device Flow (рекомендуется библиотекой)

Источник: `_client/device_auth.py`. OAuth-база: `_OAUTH_BASE_URL = 'https://oauth.yandex.ru'`.

Шаг 1 — запрос кода устройства:

```
POST https://oauth.yandex.ru/device/code
Content-Type: application/x-www-form-urlencoded

client_id=23cabbbdc6cd418abb4b39c32c41195d
&device_id=<случайная строка из 10 символов>
&device_name=YandexMusicAPI
```

(`data = {'client_id': ..., 'device_id': ..., 'device_name': ...}`, `device_name` по умолчанию `YandexMusicAPI`, `device_id` — `_rand_device_id()`: 10 символов `[A-Za-z0-9]`.)

Ответ парсится в `DeviceCode`; используются поля `device_code`, `user_code`, `verification_url`, `interval`, `expires_in` (см. `device_auth()`: `code.interval`, `code.expires_in`, `code.device_code`, в примерах — `code.verification_url`, `code.user_code`).

Шаг 2 — опрос токена:

```
POST https://oauth.yandex.ru/token
Content-Type: application/x-www-form-urlencoded

grant_type=device_code
&code=<device_code>
&client_id=23cabbbdc6cd418abb4b39c32c41195d
&client_secret=53bc75238f0c4d08a118e51fe9203300
```

- Пока пользователь не подтвердил — OAuth возвращает ошибку `authorization_pending` (в библиотеке → `BadRequestError`, распознаётся по подстроке и трактуется как «ещё не подтверждено»). Прочие ошибки (`expired_token`, `access_denied`, `invalid_client`, …) → `DeviceAuthError`.
- Результат — `OAuthToken` с полями `access_token`, `refresh_token`, `expires_in`, `token_type`.
- Опрос с интервалом `code.interval`, дедлайн `code.expires_in`. Библиотека **не сохраняет и не обновляет** токен.

Отдельные модели: `yandex_music/device_auth/device_code.py`, `yandex_music/device_auth/token.py`.

### A.3. Получение токена по логину/паролю (из OpenAPI)

`/token`, сервер `https://oauth.yandex.ru` (`src/yandex-music.yaml`):

```
POST https://oauth.yandex.ru/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id=23cabbbdc6cd418abb4b39c32c41195d
&client_secret=53bc75238f0c4d08a118e51fe9203300
&username=<логин>
&password=<пароль>
```

Ответ: `{ "access_token": str, "expires_in": number, "token_type": str, "uid": number }`.
В описании спеки отмечено, что авторизация по логину/паролю работает не для всех аккаунтов (капча, issue #140 в репозитории `MarshalX/yandex-music-api` — «Handler-функция для обработки капчи»).

### A.4. Проверка токена и получение uid

```
GET https://api.music.yandex.net/account/status
Authorization: OAuth <token>
X-Yandex-Music-Client: YandexMusicAndroid/24023621
```

- Путь: `url = f'{self.base_url}/account/status'` — `_client/account.py` (`account_status`).
- OpenAPI: `GET /account/status`, `operationId: getAccountStatus`, security `oAuth`/`oAuthProxied`.
- Полезные поля результата (`components.schemas.Status`, `account/status.py`, `account/account.py`, `account/plus.py`):
  - `result.account.uid` (int) — уникальный идентификатор; именно так библиотека его и берёт: `self.account_uid = self.me.account.uid` (`AccountMixin.init`).
  - `result.account.displayName` (str), `login`, `fullName`, `firstName`, `secondName`, `region`, `now`, `serviceAvailable`, `hostedUser`, `child`, `regionCode`, `passport-phones`.
  - `result.plus.hasPlus` (bool), `result.plus.isTutorialCompleted` (bool), `result.plus.migrated` (bool) — признак Plus-подписки.
  - `result.subscription`, `result.permissions.values[]`, `result.advertisement`, `result.cacheLimit`, `result.subeditor`, `result.subeditorLevel`, `result.defaultEmail`, `result.skipsPerHour`, `result.stationExists`, `result.stationData`, `result.barBelow`, `result.premiumRegion`, `result.experiment`, `result.pretrialActive`, `result.userhash`, `result.hasOptions[]`.
- Дополнительно: `GET /account/settings`, `POST /account/settings`, `GET /settings`, `GET /permission-alerts`, `GET /account/experiments`, `GET /account/experiments/details`, `POST /account/consume-promo-code` (`_client/account.py`), `GET /rotor/account/status` (`_client/radio.py`).

### A.5. Формат заголовка авторизации

```
Authorization: OAuth <access_token>
```

- Python: `self.headers.update({'Authorization': f'OAuth {token}'})` — `utils/request_base.py`.
- Rust: `HeaderValue::from_str(&format!("OAuth {}", self.token))` для `AUTHORIZATION` — `client/builder.rs`.

**Важно:** заголовок `Authorization` НЕ добавляется при скачивании XML download-info и самого аудиофайла — `Request.retrieve()`/`download()` передают только `proxies` и `timeout`, без `self.headers` (`utils/request.py`), и только `_prepare_kwargs` добавляет туда `User-Agent: Yandex-Music-API`.

---

## B. Поиск

### B.1. `GET /search`

Источник: `_client/search.py`:

```python
url = f'{self.base_url}/search'
params = {
    'text': text,
    'nocorrect': str(nocorrect),      # 'True' / 'False'  (! значение — Python-строка)
    'type': type_,                    # по умолчанию 'all'
    'page': page,                     # по умолчанию 0
    'playlist-in-best': str(playlist_in_best),   # по умолчанию 'True'
}
result = self._request.get(url, params, *args, **kwargs)
```

- OpenAPI (`/search`) документирует query-параметры: `text` (required), `page` (required), `type` (required, `SearchType`), `nococrrect` (boolean, default false) — **в спеке опечатка в имени параметра** (`nococrrect`); в реально используемой Python-библиотеке параметр называется `nocorrect`, и передаётся строкой `'True'/'False'`.
- `SearchType` в OpenAPI: `enum: ["artist", "album", "track", "podcast", "all"]`, default `all`.
  Python-докстрока перечисляет больше известных значений: `all`, `artist`, `user`, `album`, `playlist`, `track`, `podcast`, `podcast_episode` и отдельно отмечает: «При поиске `type=all` не возвращаются подкасты и эпизоды. Указывайте конкретный тип для поиска».
- Параметр `perPage`/`limit` в запросе — **не подтверждено** ни в Python-библиотеке, ни в OpenAPI. `perPage` существует только как **поле ответа** (`SearchResult.perPage`).

### B.2. Структура ответа

`result` (camelCase) — объект `Search` (`search/search.py`, OpenAPI `components.schemas.Search`):

```json
{
  "text": "Король и Шут",
  "searchRequestId": "....",
  "best": { },
  "albums":    { "type": "album",    "total": 0, "perPage": 20, "order": 0, "results": [] },
  "artists":   { "type": "artist",   "total": 0, "perPage": 20, "order": 0, "results": [] },
  "playlists": { "type": "playlist", "total": 0, "perPage": 20, "order": 0, "results": [] },
  "tracks":    { "type": "track",    "total": 0, "perPage": 20, "order": 0, "results": [] },
  "videos":    { ... },
  "users":     { ... },
  "podcasts":  { ... },
  "podcast_episodes": { ... },
  "clips":     { ... },
  "banner": { },
  "type": "all",
  "page": 0,
  "perPage": 20,
  "misspellResult": "...",
  "misspellOriginal": "...",
  "misspellCorrected": false,
  "nocorrect": false
}
```

- Треки: `result.tracks.results[]` — массив объектов `Track`.
- `SearchResult` (`search/search_result.py`, OpenAPI `components.schemas.SearchResult`): обязательные поля `type`, `total`, `perPage`, `order`, плюс `results`.
- `Best` — `search/best.py` (OpenAPI `components.schemas.Best`).
- Отдельные поля `videos`, `users`, `podcasts`, `podcast_episodes`, `clips` в Python-модели помечены как optional, но присутствуют в ответе.

### B.3. Объект `Track` (ключевые поля)

`track/track.py` + OpenAPI `components.schemas.Track`:

| JSON (camelCase) | Тип | Комментарий |
|---|---|---|
| `id` | string/int | Уникальный ID трека (в JSON приходит строкой, напр. `"78550148"`) |
| `realId` | string/int | «Настоящий» ID (для подменённых треков) |
| `title` | string | Название |
| `artists` | `Artist[]` | Исполнители |
| `albums` | `Album[]` | Альбомы |
| `durationMs` | number | Длительность, мс |
| `coverUri` | string | Шаблон URI обложки, содержит `%%` |
| `ogImage` | string | Open Graph картинка |
| `available` | bool | Доступен ли для прослушивания |
| `availableForPremiumUsers` | bool | Доступен ли только с подпиской |
| `availableFullWithoutPermission` | bool | Доступен ли полностью без разрешения (превью) |
| `lyricsAvailable` | bool | Есть ли текст |
| `lyricsInfo` | object | `hasAvailableSyncLyrics`/`hasAvailableTextLyrics` (`track/lyrics_info.py`) |
| `fileSize` | number | Размер файла |
| `storageDir` | string | Каталог хранения |
| `major` | `{id, name}` | Лейбл/мейджор |
| `normalization` | `{gain, peak}` | Нормализация |
| `previewDurationMs` | number | Длительность превью |
| `availableAsRbt` | bool | Доступен как рингтон |
| `contentWarning` | string | |
| `explicit` | bool | |
| `type` | string | |
| `rememberPosition` | bool | |
| `regions` | `string[]` | Регионы доступности |
| `availableForOptions` | `string[]` | Известное значение: `bookmate` |
| `version`, `substituted`, `matchedTrack`, `error`, `state`, `filename`, `userInfo`, `metaData`, `shortDescription`, `isSuitableForChildren`, `trackSource`, `backgroundVideoUri`, `derivedColors`, `fade`, `smartPreviewParams`, `specialAudioResources`, `disclaimers`, `backgroundVideoId`, `playerId`, `mixFade`, `chart`, `clipIds`, `isrc`, `ugcArtistName`, `podcastEpisodeType`, `pubDate` | | прочие поля модели |

Полный перечень полей модели — `track/track.py` (строки 118–175).

### B.4. Подсказки поиска

```
GET /search/suggest?part=<часть запроса>
```

`_client/search.py` (`search_suggest`), OpenAPI `/search/suggest`.

---

## C. Плейлисты

### C.1. Список плейлистов пользователя

```
GET /users/{uid}/playlists/list
```

- `url = f'{self.base_url}/users/{user_id}/playlists/list'` — `_client/playlists.py` (`users_playlists_list`). Возвращает `Playlist[]`.
- OpenAPI `GET /users/{userId}/playlists/list`, `operationId: getPlayLists`, ответ — массив `Playlist`.

### C.2. Один плейлист

```
GET /users/{uid}/playlists/{kind}
```

- Python: `url = f'{self.base_url}/users/{user_id}/playlists/{kind}'`, `get` без query-параметров — `_client/playlists.py` (`users_playlists`).
- OpenAPI `GET /users/{userId}/playlists/{kind}` (`getPlaylistById`) — в спеке тоже только path-параметры `userId`, `kind`.
- Rust-крейт добавляет query-параметры (`api/playlist/get_playlist.rs`):

```
users/{user_id}/playlists/{kind}?page={page}&pageSize={page_size}&trackPlayCounts={bool}&richTracks={bool}
```
  дефолты в крейте: `page=1`, `page_size=0`, `track_play_counts=false`, `rich_tracks=true`.

- **`playlistUuid` как query-параметр — не подтверждено.** В Python-библиотеке, в OpenAPI-спеке и в Rust-крейте такого query-параметра нет. `playlistUuid` встречается только как **поле ответа** (OpenAPI `components.schemas.Playlist`, `required: ["playlistUuid", ...]`; Python `Playlist.playlist_uuid`). Отдельный эндпоинт по UUID существует: `GET /playlist/{playlist_uuid}` (`_client/playlists.py`, `playlist()`).

Другие связанные эндпоинты (`_client/playlists.py`):

| Метод | Путь |
|---|---|
| GET | `/users/{uid}/playlists/{kind}` |
| POST (form `kinds`) | `/users/{uid}/playlists` |
| GET | `/users/{uid}/playlists/{kind}/recommendations` |
| POST (form `title`, `visibility`) | `/users/{uid}/playlists/create` |
| POST | `/users/{uid}/playlists/{kind}/delete` |
| POST (form `name`) | `/users/{uid}/playlists/{kind}/name` |
| POST (form `visibility`) | `/users/{uid}/playlists/{kind}/visibility` |
| POST (form `diff`, `revision`) | `/users/{uid}/playlists/{kind}/change` |
| POST (form `diff`, `revision`) | `/users/{uid}/playlists/{kind}/description`, `/users/{uid}/playlists/{kind}/trailer` |
| GET | `/playlist/{playlist_uuid}` |
| GET | `/playlist/{playlist_uuid}/similar-entities` |
| GET (`playlistIds`) | `/playlists` |
| GET | `/playlists/personal/{playlist_id}` (`daily`, `missedLikes`, `recentTracks`, `neverHeard`, `podcasts`, `origin`) |
| GET | `/users/{uid}/playlists/list/kinds` |
| POST (form `uid`, `token`) | `/playlists/collective/join` |

Внимание к контрасту: Python `playlists()` использует `GET /playlists` с query `playlistIds=<uid:kind,uid:kind>` (`kwargs['params'] = {'playlistIds': playlist_ids}`, идентификаторы в формате `uid:kind`), а `playlists_list()` (через `_get_list('playlist', ...)`) — `POST /playlists/list` с form-параметром `playlist-ids`.

### C.3. Поля плейлиста

`playlist/playlist.py` + OpenAPI `components.schemas.Playlist` (обязательные в спеке: `playlistUuid`, `description`, `descriptionFormatted`, `available`, `collective`, `created`, `modified`, `backgroundColor`, `textColor`, `durationMs`, `isBanner`, `isPremiere`, `kind`, `owner`, `revision`, `snapshot`, `tags`, `title`, `trackCount`, `uid`, `visibility`, `likesCount`, `tracks`):

```json
{
  "playlistUuid": "....",
  "uid": 541320800,
  "kind": 1000,
  "title": "Название",
  "trackCount": 42,
  "visibility": "public",
  "owner": { "uid": 541320800, "login": "...", "displayName": "...", "name": "..." },
  "cover": { "uri": "avatars.yandex.net/get-music-content/.../%%", "type": "mosaic", "prefix": "....", "version": "...." },
  "revision": 5,
  "snapshot": 12,
  "created": "2021-01-01T00:00:00+03:00",
  "modified": "2021-01-01T00:00:00+03:00",
  "available": true,
  "collective": false,
  "description": "...",
  "descriptionFormatted": "...",
  "durationMs": 123456,
  "likesCount": 3,
  "tracks": [ { "id": "123", "albumId": "456", "timestamp": "...", "playCount": 0, "recent": false, "track": { } } ]
}
```

- `visibility`: известные значения `public` / `private` (`playlist/playlist.py`, OpenAPI enum).
- `owner`, `uid`, `kind`, `title`, `track_count`, `cover`, `revision`, `snapshot`, `visibility`, `collective`, `url_part`, `created`, `modified`, `available`, `is_banner`, `is_premiere`, `duration_ms`, `og_image`, `tracks`, `prerolls`, `likes_count`, `generated_playlist_type`, `animated_cover_uri`, `ever_played`, `description`, `description_formatted`, `playlist_uuid`, `type`, `ready`, `custom_wave`, `pager`, `has_trailer`, `trailer`, `background_video_url`, `background_video_id`, `background_image_url`, `action_button`, `artist_playlist_type`, `child_content`, `derived_colors`, `made_for_user` и др. — полный список в `playlist/playlist.py`.
- Баг сервера, задокументированный в библиотеке: сервер отправляет `playlistAbsense` вместо `playlistAbsence` (`Playlist.de_json`).
- Идентификатор плейлиста для API: `f'{owner.uid}:{kind}'` (`Playlist.playlist_id`).

### C.4. Треки внутри плейлиста

- Ответ `Playlist.tracks` — массив объектов **TrackItem** (Python-класс `TrackShort`, `track_short.py`), а не полноценных `Track`:

```json
{
  "id": "12345",
  "albumId": "67890",
  "timestamp": "2021-01-01T00:00:00+03:00",
  "playCount": 0,
  "recent": false,
  "originalIndex": 0,
  "originalShuffleIndex": 0,
  "track": { /* полная модель Track */ }
}
```

- OpenAPI `components.schemas.TrackItem`: `required: [id, playCount, recent, timestamp]`, поле `track` описано как «**Null when tracks are not riched**» (то есть вложенный `track` присутствует только при «rich» выдаче).
- Python: `TrackShort.track` — «Полная версия трека»; `track_id` = `f'{id}:{album_id}'`, если `album_id` непустой, иначе `f'{id}'`.
- OpenAPI-спека `TrackShort` объявляет обязательными только `id`, `albumId`, `timestamp`.
- Чтобы получить полные `Track`, библиотека запрашивает `POST /tracks` с `track-ids=<id:albumId,...>` (`TracksList.fetch_tracks()`, `_BatchMixin._get_list`).

### C.5. «Мне нравится»

Получение лайкнутых треков (`_client/likes.py`, `_get_likes` + `users_likes_tracks`):

```
GET /users/{uid}/likes/tracks?if-modified-since-revision=<int>
```

- `url = f'{self.base_url}/users/{user_id}/likes/{object_type}s'` (для треков — `.../likes/tracks`).
- Параметр: `if-modified-since-revision` (дефолт `0`) — `_get_likes('track', user_id, {'if-modified-since-revision': if_modified_since_revision})`.
- **Расхождение:** OpenAPI документирует то же самое как `if_modified_since_revision` (с подчёркиваниями). В рабочем Python-клиенте используется вариант с дефисами.
- Форма ответа: `result.library` — объект `TracksList` (Python: `TracksList.de_json(result.get('library'), self)`), OpenAPI `/users/{userId}/likes/tracks` → `result: { library: TracksList }`.

`TracksList` (`tracks_list.py`, OpenAPI `components.schemas.TracksList`):

```json
{ "uid": 541320800, "revision": 42, "tracks": [ { "id": "123", "albumId": "456", "timestamp": "..." } ] }
```

Внимание: Python-модель объявляет поле `revision`, а OpenAPI — `revisions`. Что реально отдаёт сервер — **не подтверждено**.

Прочие эндпоинты лайков/дизлайков (`_client/likes.py`):

| Операция | Метод и путь | Тело (form) |
|---|---|---|
| Лайкнуть треки/альбомы/артистов/плейлисты | `POST /users/{uid}/likes/{track\|album\|artist\|playlist}s/add-multiple` | `{ "{type}-ids": ids }` |
| Снять лайк | `POST /users/{uid}/likes/{track\|album\|artist\|playlist}s/remove` | `{ "{type}-ids": ids }` |
| Список лайкнутых альбомов | `GET /users/{uid}/likes/albums?rich=<bool>` | |
| Список лайкнутых артистов | `GET /users/{uid}/likes/artists?with-timestamps=<bool>` | |
| Список лайкнутых плейлистов | `GET /users/{uid}/likes/playlists` | |
| Клипы | `GET /users/{uid}/likes/clips`, `POST .../clips/add`, `POST /users/{uid}/likes/clips/{clip_id}/remove` | |
| «Не рекомендовать» | `GET /users/{uid}/dislikes/tracks`, `POST /users/{uid}/dislikes/{track\|artist}s/{add-multiple\|remove}` | `{ "{type}-ids": ids }` |

Для треков успех проверяется по наличию `revision` в ответе (`is_dict(result) and 'revision' in result`); для остальных типов — `result == 'ok'`.

### C.6. URL обложки из `coverUri` / `cover.uri`

`cover.py`:

```python
def get_url(self, index: int = 0, size: str = '200x200') -> str:
    uri = self.uri
    if uri is None or uri == '':
        uri = self.items_uri[index]
    return f'https://{uri.replace("%%", size)}'
```

- В `uri` лежит хост **без схемы** (например `avatars.yandex.net/get-music-content/.../%%`), поэтому схему `https://` надо добавить самому, а `%%` заменить на размер.
- Дефолтный размер в библиотеке — `200x200`. Параметр `size` — произвольная строка; в коде библиотеки встречаются `200x200`, `300x300`; yt-dlp для превью использует `coverUri.replace('%%', 'orig')` и добавляет `http://`, если URI без схемы. Размер `400x400` в источниках прямо не зафиксирован, но механика подстановки произвольная — **значение `400x400` как таковое не подтверждено**, подтверждён сам механизм `%%` → `<size>`.
- Аналогично для плейлиста: `Playlist.get_animated_cover_url(size='300x300')` → `https://{animated_cover_uri.replace("%%", size)}`, `get_og_image_url(size='300x300')` → `https://{og_image.replace("%%", size)}` (`playlist/playlist.py`).
- У `Track` отдельный метод `download_cover` работает через `cover_uri` (`track/track.py`).

---

## D. Моя волна (rotor)

### D.1. Станции

| Метод | Путь | Параметры | Ответ |
|---|---|---|---|
| GET | `/rotor/stations/list` | `language=<ru\|en\|...>` | `StationResult[]` |
| GET | `/rotor/stations/dashboard` | — | `Dashboard` |
| GET | `/rotor/account/status` | — | статус аккаунта с доп. полями |
| GET | `/rotor/station/{station}/info` | — | `StationResult[]` |

Источники: `_client/radio.py` (`rotor_stations_list`, `rotor_stations_dashboard`, `rotor_account_status`, `rotor_station_info`); OpenAPI `/rotor/stations/list` (`language`), `/rotor/stations/dashboard`, `/rotor/account/status`, `/rotor/station/{stationId}/info`.

`Dashboard` (`rotor/dashboard.py`): `dashboardId`, `stations[]` (`StationResult`), `pumpkin`.
`StationResult` (`rotor/station_result.py`): `station`, `settings`, `settings2`, `adParams`, `explanation`, `prerolls`, `rupTitle`, `rupDescription`, `customName`.
`Station` (`rotor/station.py`): `id {type, tag}`, `name`, `icon`, `mtsIcon`, `idForFrom`, `restrictions`, `restrictions2`, `fullImageUrl`, `mtsFullImageUrl`, `parentId`.

Dокстрока `_client/radio.py` по `rotor_stations_list`: «Чтобы определить что за тип станции (жанры, настроения, занятие и т.д.) необходимо смотреть в поле **`id_for_from`**».

Идентификатор «Моей волны»: **`user:onyourwave`** (OpenAPI: `description: "ID радиостанции, для примера: user:onyourwave это моя волна"`; примеры станций в Python: `user:onyourwave`, `genre:allrock`; примеры сидов в `rotor_sessions.py`: `user:onyourwave`, `genre:rock`, `track:12345`, `artist:12345`).

### D.2. Получение треков персональной волны

```
GET /rotor/station/user:onyourwave/tracks?settings2=true
GET /rotor/station/user:onyourwave/tracks?queue=<trackId>
```

- Python (`_client/radio.py`, `rotor_station_tracks`):

```python
url = f'{self.base_url}/rotor/station/{station}/tracks'
params = {}
if settings2:            # по умолчанию True
    params = {'settings2': str(True)}
if queue is not None and queue not in {'', 0}:
    params = {'queue': queue}      # ВНИМАНИЕ: при queue параметр settings2 НЕ отправляется
result = self._request.get(url, params, ...)
```

- Rust (`api/rotor/get_station_tracks.rs`) собирает путь строкой:
  `rotor/station/{station_id}/tracks` + (`?settings2=true`, если включено) + (`&queue={queue}`, если задан). Т.е. в крейте `settings2` и `queue` могут идти вместе.
- OpenAPI `/rotor/station/{stationId}/tracks`: path `stationId`; query `settings2` (boolean, комментарий: «Все официальные клиенты выполняют запросы с `settings2 = True`») и `queue` (string, «Уникальной идентификатор трека, который только что был»).
- Параметра `howMany` в источниках **нет** — **не подтверждено**.

Структура ответа `result` (`rotor/station_tracks_result.py`, OpenAPI `components.schemas.StationTracksResult`, Rust `model/rotor/station.rs`):

```json
{
  "id": { "type": "user", "tag": "onyourwave" },
  "sequence": [
    {
      "type": "track",
      "track": { /* полный объект Track */ },
      "liked": false,
      "trackParameters": { "bpm": 0, "hue": 0, "energy": 0 }
    }
  ],
  "batchId": "....",
  "pumpkin": false,
  "radioSessionId": "...."
}
```

- `id.type` — известные типы станций: `user`, `genre` (`rotor/id.py`).
- `sequence[].type` — известное значение `track`; возможно `ad` (`rotor/sequence.py`: «Известные значения поля `type_`: `track`. Возможно есть `ad`»). OpenAPI `SequenceItem` требует `type`, `track`, `liked`, `trackParameters`.
- `batchId` — уникальный идентификатор партии (нужен для фидбеков).
- `radioSessionId` — идентификатор сессии радио (optional в Python-модели, required в OpenAPI).
- `pumpkin` — «Хэллоуин».

### D.3. Как получить «следующую пачку»

Формулировка из `_client/radio.py` (`rotor_station_tracks`, Note):

> Для продолжения цепочки треков необходимо:
> 1. Передавать `ID` трека, что был до этого (первый в цепочки).
> 2. Отправить фидбек о конце или скипе трека, что был передан в `queue`.
> 3. Отправить фидбек о начале следующего трека (второй в цепочки).
> 4. Выполнить запрос получения треков. В ответе придёт новые треки или произойдёт сдвиг цепочки на 1 элемент.
>
> Проход по цепочке до конца не изучен. Часто встречаются дубликаты.

Практический цикл: `GET .../tracks?settings2=true` → взять первый трек `T1` → `feedback trackStarted(T1, batchId)` → проиграть → `feedback trackFinished/skip(T1, totalPlayedSeconds, batchId)` → `GET .../tracks?queue=T1&...` (плюс, по описанию, `trackStarted` для следующего).

### D.4. Отправка фидбека

```
POST /rotor/station/{station}/feedback?batch-id=<batchId>[&streamId=<id>]
Authorization: OAuth <token>
Content-Type: application/json

{
  "type": "trackStarted",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "trackId": "56157695:8288161",
  "from": "mobile-radio-user-onyourwave",
  "totalPlayedSeconds": 42.5
}
```

Точный код (`_client/radio.py`, `rotor_station_feedback`):

```python
url = f'{self.base_url}/rotor/station/{station}/feedback'
params: Dict[str, str] = {}
data: Dict[str, Union[str, int, float]] = {'type': type_, 'timestamp': timestamp}

if batch_id:  params['batch-id'] = batch_id
if stream_id: params['streamId'] = stream_id
if track_id not in {'', 0}:            data.update({'trackId': track_id})
if from_:                              data.update({'from': from_})
if total_played_seconds not in {0}:    data.update({'totalPlayedSeconds': total_played_seconds})

result = self._request.post(url, params=params, json=data, **kwargs)
return result == 'ok'
```

Ключевые детали:

- `batch-id` и `streamId` — **query-параметры**, всё остальное — **JSON-тело**. Имена различаются по стилю: `batch-id` (kebab-case) и `streamId` (camelCase).
- Успех: `result == 'ok'` (строка), OpenAPI подтверждает: `result` — строка, описание «ok».
- `timestamp`: Python по умолчанию использует `utc_now_iso()` = `datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')`, т.е. `2024-01-01T12:00:00.000Z` (`_client_base.py`). OpenAPI пример: `"2023-02-26T09:41:23"`. Принимается также Unix-время в мс числом (докстрока: «строка в формате ISO 8601 или Unix-время в миллисекундах числом»).
- `from` — «Откуда начато воспроизведение радио», пример из докстроки `mobile-radio-user-123456789`, пример из OpenAPI `mobile-radio-user-onyourwave`. Music Assistant передаёт `from_="YandexMusicDesktopAppWindows"` (`ma_api_client.py`).
- `trackId` — «Уникальной идентификатор трека», пример в OpenAPI `56157695:8288161` (формат `id:albumId`).

**Значения `type`** (`_client/radio.py`): известные типы обратной связи — **`radioStarted`, `trackStarted`, `trackFinished`, `skip`**. OpenAPI `enum: [radioStarted, trackStarted, trackFinished, skip]`.

- `batch-id` «Должен отсутствовать, для типа 'radioStarted'» (OpenAPI).
- `totalPlayedSeconds` «Необходимо указывать только для типов 'trackFinished' и 'skip'» (OpenAPI).

Значения `type` `like`/`dislike` для **эндпоинта станции** в источниках **не подтверждены**. Они задокументированы только для **сессий радио** (`rotor/session/...`), см. D.6: `radioStarted`, `trackStarted`, `trackFinished`, `skip`, `skipFailed`, `like`, `unlike`, `dislike`, `undislike`, `playableItem*`, `combinedQueueStarted`, `ad`.

Готовые методы-обёртки в Python: `rotor_station_feedback_radio_started(station, from_, batch_id, timestamp)`, `rotor_station_feedback_track_started(station, track_id, batch_id, timestamp)`, `rotor_station_feedback_track_finished(station, track_id, total_played_seconds, batch_id, timestamp)`, `rotor_station_feedback_skip(...)`.

**Расхождение в Rust-крейте:** `api/rotor/send_station_feedback.rs` строит путь как

```rust
format!("rotor/session/{}/feedback", self.station_id)
```

то есть `rotor/session/{station}/feedback` вместо `rotor/station/{station}/feedback`. Это, судя по всему, ошибка крейта; Python-библиотека и OpenAPI однозначно используют `/rotor/station/{station}/feedback`. Использовать нужно вариант Python/OpenAPI.

JSON-модель фидбека в Rust (`model/rotor/feedback.rs`) — `StationFeedback { batch_id, event { type, timestamp, from, trackId, totalPlayedSeconds, playedSeconds } , from }` (сериализация camelCase для события). Обратите внимание: в этой модели `batch_id` и `from` оказываются в теле, а не в query — тоже расходится с Python.

### D.5. Настройки станции

```
POST /rotor/station/{station}/settings3
Content-Type: application/json

{ "moodEnergy": "fun", "diversity": "favorite", "type": "rotor", "language": "not-russian" }
```

`_client/radio.py` (`rotor_station_settings2`):

- `data = {'moodEnergy': mood_energy, 'diversity': diversity, 'type': type_}`; `language` добавляется, если непустой.
- `mood_energy`: `fun`, `active`, `calm`, `sad`, `all`;
- `diversity`: `favorite`, `popular`, `discover`, `default`;
- `language`: `not-russian`, `russian`, `any`;
- `type_`: `rotor`, `generative`.
- Доступные значения для конкретной станции лежат в `restrictions` → Enum'ы → `possible_values`.
- Успех — `result == 'ok'`.

### D.6. Генеративные станции (`generative:*`)

```
GET  /rotor/station/generative:focus/stream      → GenerativeStream
POST /rotor/station/generative:focus/feedback?streamId=<stream.id>
     { "type": "streamStarted" | "streamPlay" | "streamPause", "timestamp": "..." }
```

`_client/radio.py` (`rotor_station_stream`, `rotor_station_stream_feedback`). Ответ фидбека — `GenerativeStreamFeedback { reloadStream, notPaused }` (`rotor/generative_stream_feedback.py`).
Доступно только для генеративных станций (`generative:focus`, `generative:energy`, `generative:calm`, `generative:relax`); «обычные типы (`radioStarted`, `trackStarted` и т.д.) генеративные станции не принимают».

### D.7. Сессии радио (`/rotor/session/...`)

`_client/rotor_sessions.py`. Сессия — «актуальный способ слушать радио: создаётся по сидам, выдаёт партии треков и принимает обратную связь».

```
POST /rotor/session/new
{
  "seeds": ["user:onyourwave"],
  "queue": ["123:456"],
  "trackToStartFrom": "123",
  "includeTracksInResponse": true,
  "includeWaveModel": true,
  "interactive": false,
  "incognito": false,
  "child": false,
  "allowExplicit": false
}
```

Поля тела формируются функцией `_session_body` (все `None` выкидываются); `seeds` всегда массив (`[seeds]`, если передана строка). Далее:

```
POST /rotor/session/{radio_session_id}/clone     (тело то же + queue)
POST /rotor/session/{radio_session_id}/tracks    { "queue": ["123:456"], "feedbacks": [ ... ] }
POST /rotor/session/{radio_session_id}/feedback  { event..., "batchId": "...", "from": "..." }
POST /rotor/session/{radio_session_id}/feedbacks (несколько событий)
POST /rotor/sessions/feedbacks                   (сразу по нескольким сессиям)
POST /rotor/combined/session/new                 { supportedTypes, queue, child, allowExplicit }
POST /rotor/combined/session/{session_id}/next
POST /rotor/combined/session/landing             { supportedTypes, child, allowExplicit }
```

- Для несуществующей сессии API не возвращает ошибку, а выставляет `unknown_session` (`RotorSessionTracks.unknown_session`).
- Типы событий (`rotor/session_event.py`): `radioStarted`, `trackStarted`, `trackFinished`, `skip`, `skipFailed`, `like`, `unlike`, `dislike`, `undislike`, `playableItemStarted`, `playableItemFinished`, `playableItemSkip`, `playableItemLike`, `playableItemUnlike`, `playableItemDislike`, `playableItemUndislike`, `combinedQueueStarted`, `ad`.
  - `timestamp` обязателен для всех;
  - `track_id` обязателен для `trackStarted`, `trackFinished`, `skip`, `like`, `unlike`, `dislike`, `undislike`;
  - `playable` — для событий `playableItem*`;
  - `total_played_seconds` — для `trackFinished`, `skip`, `dislike`, `playableItemFinished`, `playableItemSkip`, `playableItemDislike`.
  - «События лайков и дизлайков влияют только на рекомендации и не изменяют коллекцию пользователя.»

### D.8. Волна (Wave)

`_client/wave.py`:

```
GET  /rotor/wave/last                      → Wave (последняя запущенная волна)
POST /rotor/wave/last/reset                → {"result": "ok"}
GET  /rotor/wave/settings?seeds=user:onyourwave[,genre:rock]  → WaveSettings
```

---

## E. Получение аудиопотока (самое важное)

### E.1. `GET /tracks/{trackId}/download-info`

- Python: `url = f'{self.base_url}/tracks/{track_id}/download-info'`, GET, без параметров (`_client/tracks.py`, `tracks_download_info`).
- Rust: `format!("tracks/{}/download-info", self.track_id)` (`api/track/get_download_info.rs`).
- OpenAPI: `GET /tracks/{trackId}/download-info`, path-параметр `trackId` (string, пример `"78550148"`).

Ответ (`result` — массив):

```json
[
  {
    "codec": "mp3",
    "bitrateInKbps": 320,
    "gain": false,
    "preview": false,
    "downloadInfoUrl": "https://storage.mds.yandex.net/file-download-info/136146_d158926e.14534319.6.10994777/320?sign=...&ts=5dc4a6f2",
    "direct": false
  }
]
```

- Поля обязательны все шесть: `codec`, `bitrateInKbps`, `gain`, `preview`, `downloadInfoUrl`, `direct` (`download_info.py`; OpenAPI `components.schemas.TrackDownloadInfo`, `required: [codec, gain, preview, downloadInfoUrl, direct, bitrateInKbps]`).
- `codec`: OpenAPI `enum: [mp3, aac]`. Python-докстрока `Track.download`: «Известные значения `codec`: `mp3`, `aac`».
- `bitrate_in_kbps`: «Известные значения `bitrate_in_kbps`: `64`, `128`, `192`, `320`» (`track/track.py`).
- `preview`: предварительный просмотр (в OpenAPI ошибочно объявлен строкой, в Python-модели — `bool`).
- `direct`: «Прямая ли ссылка».

### E.2. Из `downloadInfoUrl` в играбельный URL

`download_info.py` (Python) и `model/info/download_info.rs` (Rust) описывают один и тот же алгоритм.

Запрос `downloadInfoUrl` (обычный GET, **без** заголовков авторизации) возвращает XML вида:

```xml
<download-info>
  <host>storage.mds.yandex.net</host>
  <path>/get-mp3/...</path>
  <ts>5dc4a6f2</ts>
  <region>225</region>
  <s>abcdef...</s>
</download-info>
```

- Извлекаемые поля: **`host`, `path`, `ts`, `s`** (обязательны), **`region`** (присутствует в модели загрузки Rust, в Python-парсере не используется).
- Формула подписи (обе реализации совпадают):

```
SIGN_SALT = "XGRlBW9FXlekgbPrRHuSiA"
sign = md5_hex(SIGN_SALT + path[1:] + s)      // path[1:] — путь без ведущего '/'
```

Python (`download_info.py`):

```python
sign = md5((SIGN_SALT + path[1::] + s).encode('UTF-8')).hexdigest()
return f'https://{host}/get-mp3/{sign}/{ts}{path}'
```

Rust (`model/info/download_info.rs`):

```rust
const SIGN_SALT: &str = "XGRlBW9FXlekgbPrRHuSiA";
let sign = md5::compute(format!("{}{}{}", SIGN_SALT, self.path.get(1..).unwrap(), self.s));
format!("https://{}/get-mp3/{:x}/{}{}", self.host, sign, self.ts, self.path)
```

- Итог: `https://{host}/get-mp3/{sign}/{ts}{path}`. **`https` — так делает Python-библиотека** (и так же формулируется в докстроке).
- yt-dlp использует ту же формулу (`hashlib.md5(('XGRlBW9FXlekgbPrRHuSiA' + fd_data['path'][1:] + fd_data['s']).encode()).hexdigest()`), но собирает URL по `http://` и добавляет query-параметр `?track-id={track_id}`:

```python
f_url = 'http://{}/get-mp3/{}/{}?track-id={}'.format(fd_data['host'], key, fd_data['ts'] + fd_data['path'], track['id'])
```

  То есть оба варианта в проде используются (`http` + `?track-id=` в yt-dlp, `https` без него в Python-библиотеке). Что именно требует сервер — **не подтверждено** однозначно; безопасно повторять вариант Python-библиотеки, а при 4xx пробовать `?track-id=`.
- Про `get-aac`: в **этих** источниках путь `get-aac` не встречается — используется только `get-mp3` (для любого кодека из download-info). Формирование URL для AAC через `get-aac` — **не подтверждено**.

### E.3. Срок жизни ссылки

- `download_info.py`, докстрока `get_direct_link`:

> «Метод доступен только одну минуту с момента получения информации о загрузке, иначе 410 ошибка!»

(то же в `get_direct_link_async`).
- Итог: **`downloadInfoUrl` живёт ~1 минуту, после чего сервер отдаёт HTTP 410 Gone**. Значение подтверждено текстом исходника; независимой проверки в других источниках нет.
- Срок жизни уже собранного `get-mp3`-URL в источниках не указан — **не подтверждено** (косвенно он ограничен теми же `ts`/`sign`).

### E.4. Нужны ли заголовки при скачивании XML/файла

`utils/request.py`:

```python
def retrieve(self, url, timeout=..., **kwargs):
    return self._request_wrapper('GET', url, proxies=self.proxies, timeout=timeout, **kwargs)
```

`self.headers` (в котором лежат `Authorization` и `X-Yandex-Music-Client`) **не передаются**. `_prepare_kwargs` добавит только `User-Agent: Yandex-Music-API`.
=> Для запроса XML по `downloadInfoUrl` и для скачивания mp3-файла **токен не нужен**; `X-Yandex-Music-Client` тоже не отправляется (Python-библиотекой).
Требуются ли `User-Agent`/`Referer` на стороне CDN — **не подтверждено**. Отдельно: в веб-API (не `api.music.yandex.net`) yt-dlp использует заголовки `Referer`, `X-Requested-With: XMLHttpRequest`, `X-Retpath-Y` (`YandexMusicBaseIE._call_api`) — но это другой host.

### E.5. Альтернатива: `GET /get-file-info` (lossless, подписанный запрос)

`_client/tracks.py` (`tracks_file_info`) + `utils/sign_request.py`.

```
GET /get-file-info?ts=<unix>&trackId=<id>&quality=<lossless|hq|nq>&codecs=<csv>&transports=<raw|encraw>&sign=<base64>
X-Yandex-Music-Client: YandexMusicDesktopAppWindows/5.95.0
Authorization: OAuth <token>
```

Подпись:

```python
DESKTOP_SIGN_KEY = 'kzqU4XhfCaY6B6JTHODeq5'
DESKTOP_CLIENT   = 'YandexMusicDesktopAppWindows/5.95.0'

timestamp = int(now_utc.timestamp())
message = f'{timestamp}{track_id}{quality}{"".join(codecs)}{transport}'
sign = base64(hmac_sha256(DESKTOP_SIGN_KEY, message))[:-1]   # base64 без последнего символа
```

- «Подпись проверяется вместе с заголовком `X-Yandex-Music-Client`, соответствующим ключу».
- `quality`: `lossless`, `hq`, `nq`. `transport`: `raw`, `encraw`.
- `codecs` по умолчанию (`_client/tracks.py`): `['flac', 'flac-mp4', 'aac-mp4', 'he-aac-mp4', 'aac', 'he-aac', 'mp3']`. Music Assistant использует порядок `flac-mp4,flac,aac-mp4,aac,he-aac,mp3,he-aac-mp4` и отмечает: «Yandex API moved to these formats around 2025».
- Ответ: `FileInfo { downloadInfo }`, где `downloadInfo` (`track/file_download_info.py`):
  `trackId`, `quality`, `codec`, `bitrate`, `transport`, `url`, `urls[]`, `realId?`, `gain?`, `key?`.
- Известные `codec`: `flac`, `flac-mp4`, `aac-mp4`, `he-aac-mp4`, `aac`, `he-aac`, `mp3`; кодеки с суффиксом `-mp4` — в контейнере MP4. Для `flac-mp4` поле `bitrate` равно `0`.
- `transport: encraw` — файл зашифрован; ключ в hex в поле `key`, расшифровка **AES-128-CTR с нулевым IV** (`utils/decrypt.py`).
- Докстрока: «Для работы с методом необходима авторизация. Для `lossless` нужна подписка.» «Сервер сам выбирает кодек из переданных, отдавая предпочтение `quality`. Если трек недоступен в запрошенном качестве, вернётся лучший доступный вариант.»
- Music Assistant: «get-file-info with quality=lossless returns FLAC; default `/tracks/.../download-info` often does not» (`ma_api_client.py`).

Похожий подписанный запрос — текст песни (`_client/tracks.py`, `tracks_lyrics`): `GET /tracks/{track_id}/lyrics?format=<TEXT|LRC>&timeStamp=<unix>&sign=<...>` с `DEFAULT_SIGN_KEY = 'p93jhgh689SBReK6ghtw62'` и `sign = base64(hmac_sha256(key, f'{track_id}{timestamp}'))` (`utils/sign_request.py`, `get_sign_request`; `convert_track_id_to_number` отрезает `:album`).

### E.6. Что происходит с недоступными треками, лимит 320 kbps

- Признаки доступности в `Track`: `available`, `availableForPremiumUsers`, `availableFullWithoutPermission`, `availableAsRbt`, `availableForOptions` (`track/track.py`).
- Библиотека выбирает конкретный вариант из `download_info` **по кодеку И битрейту** и при отсутствии совпадения бросает `InvalidBitrateError('Unavailable bitrate')`:

```python
for info in self.download_info:
    if info.codec == codec and info.bitrate_in_kbps == bitrate_in_kbps:
        ...
raise InvalidBitrateError('Unavailable bitrate')
```
  Дефолты `Track.download`: `codec='mp3'`, `bitrate_in_kbps=192` (`track/track.py`).
- Отдельно в `exceptions.py` есть TODO: «На самом деле поиск еще происходит по кодеку — issue #552»; т.е. `InvalidBitrateError` может бросаться и из-за кодека.
- Максимум `320` kbps для lossy — подтверждается списком известных битрейтов `64/128/192/320`. Явного серверного отказа «выше 320 нельзя» в источниках нет — **не подтверждено**. Lossless доступен только через `/get-file-info` (`lossless`) и требует подписки.
- Что именно отдаёт `/tracks/{id}/download-info` при `available: false` или без Plus — **не подтверждено** (в источниках нет ни примера, ни кода обработки такого кейса). Косвенно: в списке вариантов может присутствовать `preview: true` (превью), и/или Codec/bitrate будет отсутствовать, что приведёт к `InvalidBitrateError`.

### E.7. Возможные ошибки, разбираемые клиентами

`utils/request_base.py`, `_handle_error_response` — маппинг HTTP-статусов:

| HTTP | Исключение |
|---|---|
| 401, 403 | `UnauthorizedError` |
| 400 | `BadRequestError` |
| 404 | `NotFoundError` |
| 409 (Conflict), 413 (Request Entity Too Large) | `NetworkError` |
| 502 | `NetworkError('Bad Gateway')` |
| прочее | `NetworkError(f'{message} ({status_code}): {content}')` |

Сообщение берётся из тела (`Response.get_error()`), при неразбираемом теле — `'Unknown HTTPError'`.

Конкретно 403 на download-info / «codec mp3 vs aac» — **не подтверждено** (примеров в источниках нет). 451 — **не подтверждено** (ни в одном из перечисленных источников статус 451 не упоминается).

---

## F. Прочее: лимиты, версия API, подводные камни

### F.1. Заголовок `X-Yandex-Music-Client` — нужен

- Python-библиотека ставит его **на каждый запрос** (значение по умолчанию `YandexMusicAndroid/24023621`), Rust-крейт — тоже (`DEFAULT_CLIENT_ID`).
- Для `/get-file-info` он должен быть именно `YandexMusicDesktopAppWindows/5.95.0`, потому что HMAC-подпись привязана к этому заголовку (`utils/sign_request.py`: «Подпись проверяется вместе с заголовком `X-Yandex-Music-Client`, соответствующим ключу»; `DESKTOP_CLIENT = 'YandexMusicDesktopAppWindows/5.95.0'`).
- Версия клиента: `YandexMusicAndroid/24023621` (Android). Другие версии/строки в проверенных источниках не встречаются — конкретный требуемый минимум версии **не подтверждён**.

### F.2. Версия API

- В URL версия не указывается: `https://api.music.yandex.net/<path>` (в отличие от веб-API `https://music.yandex.ru/handlers/...jsx` у yt-dlp).
- Публичного номера версии API в источниках нет — **не подтверждено**. OpenAPI-спека имеет `info.version: 0.0.1` (это версия самой спеки).

### F.3. Лимиты запросов

Официально нигде не документированы — **не подтверждено** в смысле формальных значений. Есть только эмпирика Music Assistant (`ma_constants.py`, PR #4011):

- `THROTTLE_DEFAULT_RPS = 5`, `THROTTLE_METADATA_RPS = 3`, `THROTTLE_FILE_INFO_RPS = 2`, `THROTTLE_ROTOR_RPS = 3`.
- Комментарий: «empirical probing showed Yandex tolerates ≥10 sustained sequential RPS on both residential and datacenter IPs»; «file_info is signed + most aggressively rate-limited at Yandex's edge».
- `RESTRICTIVE_GLOBAL_CONCURRENCY = 5` — общий кап одновременных запросов для «datacenter/VPN»: «Yandex's edge enforces the cap per-token», «probed at ~6 simultaneous in-flight before captcha trips (N=8 trips, N≤6 clean)»; per-endpoint сериализация: «≤1 concurrent per endpoint».
- Реакция на лимит: **HTTP 429**; различают «просто 429» (короткий backoff только для запроса) и «капча» (quarantine для всего семейства эндпоинтов). Кулдауны: `CAPTCHA_COOLDOWN_LADDER_S = (15.0, 60.0, 120.0)`, `RATE_LIMIT_COOLDOWN_S = 60.0`.

### F.4. Капча

- Признаки капчи в теле 429-ответа (`ma_api_client.py`): `_CAPTCHA_MARKERS = ("smart-captcha", "captcha_smart_qrcode", "about-429.html")` — то есть приходит **HTML** с маркерами SmartCaptcha.
- yt-dlp (`yt_dlp/extractor/yandexmusic.py`) трактует как капчу:
  - JSON-ответ с `type == 'captcha'` или содержащий `'captcha'`;
  - HTML, содержащий строку `«Нам очень жаль, но запросы, поступившие с вашего IP-адреса, похожи на автоматические.»`
  Сообщение пользователю: «YandexMusic has considered yt-dlp requests automated and asks you to solve a CAPTCHA… go to https://music.yandex.ru/, solve CAPTCHA, then export cookies and pass cookie file».
- Капча также возникает при авторизации по логину/паролю (issue #140 в `MarshalX/yandex-music-api`: «После нескольких неудачных попыток входа, Яндекс просит ввести капчу»).
- Cookie-механика (какие именно cookie нужны `api.music.yandex.net`) — **не подтверждено**.

### F.5. Регион и доступность трека

- Поля, отражающие регион: `Account.region` (int), `Account.regionCode` (str), `Track.regions` (string[]), а также `<region>` в XML download-info (Rust-модель).
- Отказ по региону (`451`, «track not available») — **не подтверждено**: в проверенных источниках нет ни кода 451, ни структуры такой ошибки.
- Признаки недоступности плейлиста: `playlistAbsence` / серверная опечатка `playlistAbsense` (`playlist/playlist.py`).
- `Track.available`, `availableForPremiumUsers`, `availableFullWithoutPermission`, `availableForOptions` (`bookmate`) — см. B.3.

### F.6. Подписка Plus

- `GET /account/status` → `result.plus.hasPlus` (bool), `result.plus.isTutorialCompleted`, `result.plus.migrated` (`account/plus.py`, OpenAPI `Status.plus`).
- Права/опции: `result.permissions.values[]` — OpenAPI перечисляет значения `landing-play`, `feed-play`, `radio-play`, `mix-play`, `radio-skips`, `play-radio-full-tracks`, … (полный список в схеме `Permissions`).
- `result.subscription` — информация о подписках (`account/subscription.py`).
- Lossless (`/get-file-info` с `quality=lossless`) требует подписки (`_client/tracks.py`).
- Связь «Plus отсутствует → download-info отдаёт только превью/ошибку» — **не подтверждено**.

### F.7. Прочие замеченные подводные камни

- **Разные схемы именования параметров** в одном API: `batch-id` (kebab), `streamId` (camel), `if-modified-since-revision` (kebab), `playlist-in-best` (kebab), `track-ids`/`album-ids` (kebab), `playlistIds` (camel, `/playlists`), `plainIds`-стиль в других местах. Нельзя полагаться на единый стиль — сверяться с таблицей.
- `batch-id` и streamId при фидбеке станции — **query**, а не тело.
- В Python `settings2` передаётся как строка `'True'`, а `nocorrect`/`playlist-in-best` — как `str(bool)` → `'True'/'False'`. OpenAPI описывает их как boolean. Что принимает сервер фактически — **не подтверждено**; вероятно, оба варианта.
- При `queue` Python-библиотека **перестаёт** отправлять `settings2` (в отличие от Rust-крейта).
- Серверные опечатки: `playlistAbsense`; в OpenAPI — `nococrrect`, `fisrtName`, `revisions`.
- Ответ может не иметь `result`: Python `_parse` в этом случае оборачивает весь корень как `result` (`data = {'result': data, ...}`) — на это стоит опираться при нестандартных эндпоинтах (например, `POST /rotor/wave/last/reset` возвращает `{"result": "ok"}`, а `_client/wave.py` проверяет `result.get('result') == 'ok'`).
- Проверка успеха различается: где-то `result == 'ok'`, где-то наличие `revision`, где-то просто непустой словарь.
- `likes/tracks` возвращает `result.library`, а не массив.

---

## Приложение: соответствие Python-метод → HTTP (кратко)

| Python-метод | Метод + путь |
|---|---|
| `account_status` | `GET /account/status` |
| `account_settings` / `account_settings_set` | `GET`/`POST /account/settings` |
| `settings` | `GET /settings` |
| `permission_alerts` | `GET /permission-alerts` |
| `search` | `GET /search?text&nocorrect&type&page&playlist-in-best` |
| `search_suggest` | `GET /search/suggest?part` |
| `tracks` | `POST /tracks` (form `track-ids`, `with-positions`) |
| `tracks_download_info` | `GET /tracks/{trackId}/download-info` |
| `tracks_file_info` | `GET /get-file-info?ts&trackId&quality&codecs&transports&sign` |
| `tracks_lyrics` | `GET /tracks/{trackId}/lyrics?format&timeStamp&sign` |
| `track_supplement` | `GET /tracks/{trackId}/supplement` |
| `tracks_similar` | `GET /tracks/{trackId}/similar` |
| `tracks_trailer` | `GET /tracks/{trackId}/trailer` |
| `tracks_full_info` | `GET /tracks/{trackId}/full-info` |
| `play_audio` | `POST /play-audio` (query `track-id`, `from-cache`, `from`, `play-id`, `uid`, `timestamp`, `track-length-seconds`, `total-played-seconds`, `end-position-seconds`, `album-id`, `playlist-id`, `client-now`) |
| `after_track` | `POST /after-track` (query `from`, `prevTrackId`, `nextTrackId`, `context`, `contextItem`, `types`) |
| `users_playlists_list` | `GET /users/{uid}/playlists/list` |
| `users_playlists` (один) | `GET /users/{uid}/playlists/{kind}` |
| `users_playlists` (список) | `POST /users/{uid}/playlists` (form `kinds`) |
| `users_playlists_kinds` | `GET /users/{uid}/playlists/list/kinds` |
| `playlist` | `GET /playlist/{playlist_uuid}` |
| `playlists` | `GET /playlists?playlistIds=uid:kind,...` |
| `playlists_list` | `POST /playlists/list` (form `playlist-ids`) |
| `playlists_personal` | `GET /playlists/personal/{playlist_id}` |
| `users_likes_tracks` | `GET /users/{uid}/likes/tracks?if-modified-since-revision` |
| `users_likes_tracks_add` / `_remove` | `POST /users/{uid}/likes/tracks/add-multiple` / `.../remove` |
| `rotor_stations_list` | `GET /rotor/stations/list?language` |
| `rotor_stations_dashboard` | `GET /rotor/stations/dashboard` |
| `rotor_station_info` | `GET /rotor/station/{station}/info` |
| `rotor_station_tracks` | `GET /rotor/station/{station}/tracks?settings2=true` \| `?queue=<id>` |
| `rotor_station_feedback` | `POST /rotor/station/{station}/feedback?batch-id[&streamId]` (JSON) |
| `rotor_station_settings2` | `POST /rotor/station/{station}/settings3` (JSON) |
| `rotor_station_stream` | `GET /rotor/station/{station}/stream` |
| `rotor_station_stream_feedback` | `POST /rotor/station/{station}/feedback?streamId` (JSON) |
| `rotor_session_new` | `POST /rotor/session/new` (JSON) |
| `rotor_session_tracks` | `POST /rotor/session/{id}/tracks` (JSON) |
| `rotor_session_feedback` | `POST /rotor/session/{id}/feedback` (JSON) |
| `rotor_session_feedbacks` | `POST /rotor/session/{id}/feedbacks` |
| `rotor_sessions_feedbacks` | `POST /rotor/sessions/feedbacks` |
| `rotor_wave_last` | `GET /rotor/wave/last` |
| `rotor_wave_last_reset` | `POST /rotor/wave/last/reset` |
| `rotor_wave_settings` | `GET /rotor/wave/settings?seeds` |
| `albums` | `POST /albums` (form `album-ids`) |
| `artists` | `POST /artists` (form `artist-ids`) |
| `users_settings` | `GET /users/{uid}/settings` |
| `playlists_collective_join` | `POST /playlists/collective/join` (query `uid`, `token`) |
| `device_auth` | `POST https://oauth.yandex.ru/device/code`, `POST https://oauth.yandex.ru/token` |

---

## Сводка «не подтверждено»

1. `redirect_uri` неофициального OAuth-приложения (в URL не указан; своё приложение создать нельзя).
2. `perPage`/`limit` как query-параметр `/search` (в источниках только поле ответа `perPage`).
3. `playlistUuid` как **query**-параметр `GET /users/{uid}/playlists/{kind}` (в Python/OpenAPI/Rust только path-параметры; `playlistUuid` есть только как поле ответа и как отдельный путь `GET /playlist/{uuid}`).
4. Размер обложки именно `400x400` (подтверждён механизм подстановки `%%` → `<size>`, дефолт библиотеки `200x200`).
5. Наличие альтернативного пути `get-aac` (в источниках только `get-mp3`).
6. Формат ошибки/статус при `available: false`, при отсутствии Plus, «track not available»; код 451; отказ по региону.
7. Требования CDN к `User-Agent`/`Referer` при скачивании mp3; срок жизни уже собранного `get-mp3`-URL (для `downloadInfoUrl` заявлена 1 минута и 410).
8. «Предел 320 kbps» как серверное ограничение (подтверждён только список известных битрейтов `64/128/192/320`).
9. Точные значения `like`/`dislike` для эндпоинта `/rotor/station/{station}/feedback` (для сессий `/rotor/session/...` они документированы).
10. Формальные лимиты запросов (есть только эмпирика Music Assistant: 5/3/2/3 RPS, капча при ~6–8 одновременных запросах с datacenter-IP, 429 с HTML-маркерами SmartCaptcha).
11. Номер «версии API» — в пути не используется, публичного номера нет.
12. Поле `revision` vs `revisions` в `TracksList`.
13. Cookie-механика для обхода капчи.
