# Сборка Android-версии

Заметки о том, как собрать APK для телефона. Всё делается скриптами, вручную
ничего настраивать не нужно — но полезно понимать, что происходит.

## Что нужно один раз поставить

Тулчейн живёт в `C:\Android` и в систему не прописывается:

```powershell
# скачать JDK 17 и Android command-line tools
node .tools/fetch.mjs "https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip" "C:\Android\jdk.zip"
node .tools/fetch.mjs "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" "C:\Android\cmdline-tools.zip"

# распаковать, принять лицензии, поставить NDK и цели Rust
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\android-setup.ps1
```

Скрипт поставит: `platform-tools`, `platforms;android-34`, `build-tools;34.0.0`,
`ndk;27.0.12077973`, `cmake` и четыре цели Rust под Android.

## Создать Android-проект (один раз)

```powershell
npm run android:init
```

Появится папка `src-tauri/gen/android` — это обычный проект Android Studio.

## Собрать APK

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\android-apk.ps1
```

На выходе: `releases\CoumMusic-android.apk` — подписанный, готовый к установке.

## Почему не `tauri android build`

На Windows команда Tauri создаёт **символическую ссылку** на нативную
библиотеку, а для этого нужен режим разработчика или права администратора.
Без них сборка падает с ошибкой `Creation symbolic link is not allowed`.

Скрипт обходит это: берёт библиотеку, которую Tauri уже собрал, кладёт её в
`jniLibs`, запускает Gradle с пропуском задачи сборки Rust и подписывает APK
через `apksigner`. Результат тот же.

## Если сборка ломается

**Пустая папка `assets`.** Tauri копирует туда фронтенд сам, но при ручном
запуске Gradle этого не происходит — приложение запустится в белый экран.
Скрипт копирует `dist` в `app/src/main/assets` перед сборкой.

**`java.io.IOException: Wrong password` при подписи.** В Java 17 у PKCS12
пароль ключа совпадает с паролем хранилища: `keytool` игнорирует отдельный
`-keypass`. В `apksigner` нужно передавать тот же пароль, что и для `--ks-pass`.

**Windows PowerShell 5.1 и кириллица.** Эта оболочка читает `.ps1` без BOM как
ANSI, поэтому скрипты сборки написаны латиницей. Не добавляй в них русский
текст — файл перестанет разбираться.

## Подпись

Ключ лежит в `src-tauri/gen/android/coum-release.keystore` (пароль
`coum-music-store`, псевдоним `coum`). Он создаётся автоматически при первой
сборке.

Ключ нужен, чтобы Android разрешил установку и чтобы обновления ставились
поверх старой версии. **Не потеряй его**: с другим ключом приложение придётся
удалять перед установкой новой версии. В репозиторий ключ не попадает
(`gen/` исключён из публикации).

## Что ещё не сделано

- **Фоновое воспроизведение и управление в шторке.** Для этого нужен нативный
  Android-сервис и `MediaSession` на Kotlin. Сейчас музыка играет, пока
  приложение открыто; при сворачивании система может остановить воспроизведение.
- **Вход через Яндекс на телефоне.** OAuth открывает отдельное окно, которого
  на Android толком нет, поэтому на телефоне раскрыт ввод токена вручную:
  открыть ссылку авторизации в браузере и скопировать `access_token` из адреса.
- **Уведомления о новой версии** не устанавливаются сами: APK скачивается и
  ставится руками.
