# Compila o app Android no Windows.
# O CMake do react-native-reanimated monta caminhos com mais de 260 caracteres quando o
# projeto está numa pasta funda (ex.: Desktop) e o ninja falha com "mkdir ... No such file".
# Compilar numa cópia em pasta curta resolve sem mexer em configuração do sistema.
#
#   powershell -ExecutionPolicy Bypass -File scripts/build-android-local.ps1            # debug, instala no emulador
#   powershell -ExecutionPolicy Bypass -File scripts/build-android-local.ps1 -Release   # gera dist-apk/Aquenda-<versão>.apk
param(
  [string]$PastaCurta = "C:\aq",
  [switch]$Release,
  [string]$Arquiteturas = "x86_64,arm64-v8a"
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$versao = (Get-Content "$raiz\package.json" -Raw | ConvertFrom-Json).version

Write-Host "espelhando $raiz -> $PastaCurta"
robocopy $raiz $PastaCurta /MIR /NFL /NDL /NJH /NP /MT:16 `
  /XD "$raiz\android" "$raiz\ios" "$raiz\.git" "$raiz\.expo" "$raiz\dist-apk" "$PastaCurta\android" | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy falhou ($LASTEXITCODE)" }

Push-Location $PastaCurta
try {
  npx expo prebuild -p android --no-install
  if ($LASTEXITCODE -ne 0) { throw "prebuild falhou" }
  Push-Location android
  $tarefa = if ($Release) { "assembleRelease" } else { "assembleDebug" }
  .\gradlew.bat $tarefa --no-daemon "-PreactNativeArchitectures=$Arquiteturas" "-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g"
  if ($LASTEXITCODE -ne 0) { throw "gradle falhou" }
  Pop-Location
} finally {
  Pop-Location
}

if ($Release) {
  New-Item -ItemType Directory -Force "$raiz\dist-apk" | Out-Null
  $destino = "$raiz\dist-apk\Aquenda-$versao.apk"
  Copy-Item "$PastaCurta\android\app\build\outputs\apk\release\app-release.apk" $destino -Force
  Write-Host "apk: $destino"
} else {
  adb install -r "$PastaCurta\android\app\build\outputs\apk\debug\app-debug.apk"
  Write-Host "instalado. Rode 'npx expo start' na pasta do projeto e abra o app."
}
