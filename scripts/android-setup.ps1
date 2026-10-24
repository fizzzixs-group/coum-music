# Android toolchain setup for Coum Music.
#
# ASCII only on purpose: Windows PowerShell 5.1 reads .ps1 without a BOM as
# ANSI, so non-latin characters in this file break parsing.
#
# What it does:
#   1. unpacks the JDK and Android command-line tools into C:\Android
#   2. accepts SDK licenses and installs platform, build-tools and NDK
#   3. adds Rust targets for Android
#
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\android-setup.ps1

$ErrorActionPreference = "Stop"

$Root = "C:\Android"
$JdkDir = "$Root\jdk"
$SdkDir = "$Root\sdk"
$NdkVersion = "27.0.12077973"

function Step($text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

# Windows PowerShell 5.1 treats anything a native program writes to stderr as a
# terminating error while ErrorActionPreference is Stop. java, sdkmanager and
# rustup all write progress there, so run them with the preference relaxed.
function Run($file, [string[]]$arguments) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $file @arguments 2>&1
  $ErrorActionPreference = $previous
}

Step "Checking downloads"
foreach ($file in @("$Root\jdk.zip", "$Root\cmdline-tools.zip")) {
  if (-not (Test-Path $file)) {
    throw "missing $file - download it first with node .tools/fetch.mjs"
  }
  Write-Host "  found: $file"
}

Step "Unpacking JDK"
if (Test-Path $JdkDir) {
  Write-Host "  already unpacked"
} else {
  $tmp = "$Root\_jdk"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive "$Root\jdk.zip" -DestinationPath $tmp -Force
  # The archive holds a single folder like jdk-17.0.13+11 - move its contents up.
  $inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
  Move-Item $inner.FullName $JdkDir
  Remove-Item $tmp -Recurse -Force
  Write-Host "  JDK: $JdkDir"
}

Step "Unpacking Android command-line tools"
$cmdline = "$SdkDir\cmdline-tools\latest"
if (Test-Path $cmdline) {
  Write-Host "  already unpacked"
} else {
  $tmp = "$Root\_cmdline"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive "$Root\cmdline-tools.zip" -DestinationPath $tmp -Force
  New-Item -ItemType Directory -Force $cmdline | Out-Null
  Move-Item "$tmp\cmdline-tools\*" $cmdline
  Remove-Item $tmp -Recurse -Force
  Write-Host "  SDK tools: $cmdline"
}

$env:JAVA_HOME = $JdkDir
$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir
$env:PATH = "$JdkDir\bin;$cmdline\bin;$env:PATH"

Step "Java version"
Run "$JdkDir\bin\java.exe" @("-version") | Select-Object -First 1

$sdkmanager = "$cmdline\bin\sdkmanager.bat"

Step "Accepting SDK licenses"
# sdkmanager asks for confirmation per license - answer yes to all of them.
$answers = ("y`n" * 40)
$previous = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$answers | & $sdkmanager --sdk_root="$SdkDir" --licenses 2>&1 | Select-Object -Last 3
$ErrorActionPreference = $previous

Step "Installing SDK packages and NDK"
Run $sdkmanager @(
  "--sdk_root=$SdkDir",
  "platform-tools",
  "platforms;android-34",
  "build-tools;34.0.0",
  "ndk;$NdkVersion",
  "cmake;3.22.1"
) | Select-Object -Last 6

Step "Adding Rust targets for Android"
foreach ($target in @(
    "aarch64-linux-android",    # most modern phones
    "armv7-linux-androideabi",  # older devices
    "i686-linux-android",       # x86 emulator
    "x86_64-linux-android"      # x64 emulator
  )) {
  Run "rustup" @("target", "add", $target) | Select-Object -Last 1
}

Step "Done"
Write-Host "  JAVA_HOME    = $JdkDir"
Write-Host "  ANDROID_HOME = $SdkDir"
Write-Host "  NDK          = $SdkDir\ndk\$NdkVersion"
Write-Host ""
Write-Host "Next:  npm run android:init   (creates the Android project)"
Write-Host "       npm run android:build  (builds the APK)"
