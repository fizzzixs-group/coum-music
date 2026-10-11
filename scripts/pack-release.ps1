# Packs release artifacts into releases/<version>/ and zips them.
#
# Usage: npm run release:pack   (after npm run app:build)
#
# Output:
#   releases/v0.1.0/Coum Music_0.1.0_x64-setup.exe   - installer
#   releases/v0.1.0/coum-music.exe                  - portable build
#   releases/CoumMusic-0.1.0-win-x64.zip            - everything in one archive
#
# ASCII only: Windows PowerShell 5.1 reads BOM-less files as ANSI and mangles Cyrillic.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version
$tag = "v$version"

$bundleDir = Join-Path $root "src-tauri\target\release\bundle\nsis"
$portableExe = Join-Path $root "src-tauri\target\release\coum-music.exe"
$setupExe = Get-ChildItem $bundleDir -Filter "*_x64-setup.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $setupExe) {
    Write-Error "Installer not found in $bundleDir - run: npm run app:build"
}
if (-not (Test-Path $portableExe)) {
    Write-Error "Portable exe not found: $portableExe"
}

$outDir = Join-Path $root "releases\$tag"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Copy-Item $setupExe.FullName (Join-Path $outDir $setupExe.Name) -Force
Copy-Item $portableExe (Join-Path $outDir "coum-music.exe") -Force

$readme = @"
Coum Music $version (Windows x64)
=================================

Installer:  $($setupExe.Name)
Portable:   coum-music.exe - runs without installation

Sign in:    Settings -> Sign in with Yandex
Token path: %APPDATA%\com.coum.music\session.json
Telegram:   https://t.me/coumfun
"@
Set-Content -Path (Join-Path $outDir "README.txt") -Value $readme -Encoding UTF8

# Zip AFTER every file is in place, otherwise the archive misses the readme.
$zipPath = Join-Path $root "releases\CoumMusic-$version-win-x64.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Done:"
Get-ChildItem $outDir | ForEach-Object { Write-Host ("  {0}  {1:N2} MB" -f $_.Name, ($_.Length / 1MB)) }
Write-Host ("  Archive: CoumMusic-{0}-win-x64.zip  {1:N2} MB" -f $version, ((Get-Item $zipPath).Length / 1MB))
