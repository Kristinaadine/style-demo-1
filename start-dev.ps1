<#
  start-dev.ps1 - jalankan semua server BRA Running Style di localhost.

  Pakai dari root repo:
      powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

  Yang dijalankan:
      1. MariaDB (XAMPP) - port 3306, datadir data_bra_running_style
      2. Node API (server/index.js) - http://localhost:3001
      3. Frontend (PHP built-in server) - http://localhost:8123
#>

[CmdletBinding()]
param(
  [string]$MysqlHome    = "C:\xampp\mysql",
  [string]$PhpExe       = "C:\xampp\php\php.exe",
  [string]$MysqlDatadir = "C:\xampp\mysql\data_bra_running_style",
  [int]$ApiPort         = 3001,
  [int]$WebPort         = 8123
)

$ErrorActionPreference = "Stop"
$root   = $PSScriptRoot
$logDir = Join-Path $root ".dev-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Port([int]$Port) {
  [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-Port([int]$Port, [int]$TimeoutSeconds = 20) {
  for ($i = 0; $i -lt ($TimeoutSeconds * 2); $i++) {
    if (Test-Port $Port) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# --- 1. MariaDB -------------------------------------------------------------

if (Test-Port 3306) {
  Write-Host "[ok]    MariaDB sudah berjalan di port 3306"
} else {
  Write-Host "[start] MariaDB (datadir: $MysqlDatadir)"
  $mysqld = Join-Path $MysqlHome "bin\mysqld.exe"
  $myIni  = Join-Path $MysqlDatadir "my.ini"

  if (-not (Test-Path $mysqld)) { throw "mysqld.exe tidak ditemukan di $mysqld" }
  if (-not (Test-Path $myIni))  { throw "my.ini tidak ditemukan di $myIni" }

  $iniArg = $myIni.Replace('\', '/')
  Start-Process -FilePath $mysqld `
    -ArgumentList "--defaults-file=$iniArg", "--standalone", "--port=3306", "--console" `
    -RedirectStandardOutput (Join-Path $logDir "mysqld.out.log") `
    -RedirectStandardError  (Join-Path $logDir "mysqld.err.log") `
    -WindowStyle Hidden | Out-Null

  if (Wait-Port 3306) {
    Write-Host "[ok]    MariaDB siap di port 3306"
  } else {
    Write-Warning "MariaDB tidak merespons di port 3306. Lihat .dev-logs\mysqld.err.log"
  }
}

# --- 2. Node API -----------------------------------------------------------

if (Test-Port $ApiPort) {
  Write-Host "[ok]    API Node sudah berjalan di port $ApiPort"
} else {
  Write-Host "[start] API Node (server/index.js)"
  $serverDir = Join-Path $root "server"

  if (-not (Test-Path (Join-Path $serverDir "node_modules"))) {
    throw "node_modules belum ada. Jalankan dulu: cd server; npm install"
  }

  Start-Process -FilePath "node" -ArgumentList "index.js" `
    -WorkingDirectory $serverDir `
    -RedirectStandardOutput (Join-Path $logDir "api.out.log") `
    -RedirectStandardError  (Join-Path $logDir "api.err.log") `
    -WindowStyle Hidden | Out-Null

  if (Wait-Port $ApiPort) {
    Write-Host "[ok]    API siap di http://localhost:$ApiPort"
  } else {
    Write-Warning "API tidak merespons di port $ApiPort. Lihat .dev-logs\api.err.log"
  }
}

# --- 3. Frontend (PHP) -----------------------------------------------------

if (Test-Port $WebPort) {
  Write-Host "[ok]    Frontend sudah berjalan di port $WebPort"
} else {
  Write-Host "[start] Frontend (PHP built-in server)"
  if (-not (Test-Path $PhpExe)) { throw "php.exe tidak ditemukan di $PhpExe" }

  Start-Process -FilePath $PhpExe -ArgumentList "-S", "localhost:$WebPort", "-t", "." `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logDir "php.out.log") `
    -RedirectStandardError  (Join-Path $logDir "php.err.log") `
    -WindowStyle Hidden | Out-Null

  if (Wait-Port $WebPort) {
    Write-Host "[ok]    Frontend siap di http://localhost:$WebPort"
  } else {
    Write-Warning "Frontend tidak merespons di port $WebPort. Lihat .dev-logs\php.err.log"
  }
}

# --- Ringkasan -------------------------------------------------------------

Write-Host ""
Write-Host "Frontend : http://localhost:$WebPort"
Write-Host "API      : http://localhost:$ApiPort/api/status"
Write-Host "Database : MariaDB port 3306 (bra_running_style)"
Write-Host "Log      : $logDir"
Write-Host ""
Write-Host "Hentikan semua dengan: powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1"
