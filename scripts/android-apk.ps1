# Builds a signed Android APK for Coum Music.
#
# Why not `tauri android build`: on Windows it creates a symbolic link for the
# native library, and that needs Developer Mode. Instead we take the library it
# already produced, let Gradle package it while skipping the Rust task, and sign
# the result ourselves.
#
# ASCII only: Windows PowerShell 5.1 reads .ps1 without a BOM as ANSI.
#
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\android-apk.ps1

$ErrorActionPreference = "Stop"

$Project = "C:\CoumMusic"
$Android = "C:\Android"
$Sdk = "$Android\sdk"
$Jdk = "$Android\jdk"
$Ndk = "$Sdk\ndk\27.0.12077973"
$BuildTools = "$Sdk\build-tools\36.0.0"

$ApkDir = "$Project\src-tauri\gen\android\app\build\outputs\apk\arm64\release"
$Unsigned = "$ApkDir\app-arm64-release-unsigned.apk"
$Keystore = "$Project\src-tauri\gen\android\coum-release.keystore"
$Aligned = "$ApkDir\app-arm64-release-aligned.apk"
$Final = "$Project\releases\CoumMusic-android.apk"

$StorePass = "coum-music-store"
$KeyPass = "coum-music-store"
$Alias = "coum"

function Step($text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Run($file, [string[]]$arguments) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $file @arguments 2>&1
  $ErrorActionPreference = $previous
}

$env:JAVA_HOME = $Jdk
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:NDK_HOME = $Ndk
$env:PATH = "$Jdk\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"

Step "Signing key"
if (-not (Test-Path $Keystore)) {
  Run "$Jdk\bin\keytool.exe" @(
    "-genkeypair", "-v",
    "-keystore", $Keystore,
    "-alias", $Alias,
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-storepass", $StorePass,
    "-keypass", $KeyPass,
    "-dname", "CN=Coum Music, O=Coum, C=RU"
  ) | Select-Object -Last 3
  Write-Host "  created: $Keystore"
} else {
  Write-Host "  already exists: $Keystore"
}

Step "Building the native library"
Push-Location "$Project\src-tauri"
# The NDK toolchain has to be configured by hand here: `tauri android build`
# normally sets these up, but we are calling cargo directly.
$ndkToolchain = "$Ndk\toolchains\llvm\prebuilt\windows-x86_64\bin"
$env:CC_aarch64_linux_android = "$ndkToolchain\aarch64-linux-android24-clang.cmd"
$env:AR_aarch64_linux_android = "$ndkToolchain\llvm-ar.exe"
$env:CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = "$ndkToolchain\aarch64-linux-android24-clang.cmd"
Run "cargo" @(
  "build", "--package", "coum-music",
  "--target", "aarch64-linux-android",
  "--features", "tauri/custom-protocol",
  "--lib", "--release"
) | Select-Object -Last 3
Pop-Location

$so = "$Project\src-tauri\target\aarch64-linux-android\release\libcoum_music_lib.so"
if (-not (Test-Path $so)) { throw "no native library at $so" }
$jni = "$Project\src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a"
New-Item -ItemType Directory -Force $jni | Out-Null
Copy-Item $so "$jni\libcoum_music_lib.so" -Force
Write-Host "  copied to jniLibs"

Step "Packing the frontend into the Android assets"
# `tauri android build` normally copies the web build into the Android project;
# since we drive Gradle ourselves, do it here. Without this the app starts to a
# blank screen: the APK simply has no interface inside.
Push-Location $Project
Run "npm" @("run", "build") | Select-Object -Last 3
Pop-Location

$assets = "$Project\src-tauri\gen\android\app\src\main\assets"
if (Test-Path $assets) { Remove-Item "$assets\*" -Recurse -Force }
New-Item -ItemType Directory -Force $assets | Out-Null
Copy-Item "$Project\dist\*" $assets -Recurse -Force
Write-Host "  files copied: $((Get-ChildItem $assets -Recurse -File).Count)"

Step "Packaging with Gradle"
Push-Location "$Project\src-tauri\gen\android"
Run ".\gradlew.bat" @(
  "assembleArm64Release",
  "-x", "rustBuildArm64Release",
  "-x", "rustBuildArmRelease",
  "--no-daemon"
) | Select-Object -Last 5
Pop-Location

if (-not (Test-Path $Unsigned)) { throw "gradle did not produce $Unsigned" }

Step "Aligning and signing"
if (Test-Path $Aligned) { Remove-Item $Aligned -Force }
Run "$BuildTools\zipalign.exe" @("-p", "-f", "4", $Unsigned, $Aligned) | Select-Object -Last 2

if (Test-Path $Final) { Remove-Item $Final -Force }
Run "$BuildTools\apksigner.bat" @(
  "sign",
  "--ks", $Keystore,
  "--ks-key-alias", $Alias,
  "--ks-pass", "pass:$StorePass",
  "--key-pass", "pass:$KeyPass",
  "--out", $Final,
  $Aligned
) | Select-Object -Last 3

Step "Checking the signature"
Run "$BuildTools\apksigner.bat" @("verify", "--print-certs", $Final) | Select-Object -First 6

Step "Done"
$size = [math]::Round((Get-Item $Final).Length / 1MB, 2)
Write-Host "  APK: $Final ($size MB)"
Write-Host ""
Write-Host "Copy it to the phone and open it. Android will ask to allow installing"
Write-Host "apps from this source - that is expected for a file installed by hand."
