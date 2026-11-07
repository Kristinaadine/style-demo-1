<#
  stop-dev.ps1 - hentikan semua server BRA Running Style.

  Pakai dari root repo:
      powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1

  MariaDB dihentikan dengan mysqladmin shutdown (graceful), bukan kill.
#>

[CmdletBinding()]
param(
  [string]$MysqlHome = "C:\xampp\mysql",
  [int]$ApiPort      = 3001,
  [int]$WebPort      = 8123
)

$ErrorActionPreference = "Continue"

function Stop-ByPort([int]$Port, [string]$Label) {
  $pids = (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess |
          Sort-Object -Unique

  if (-not $pids) {
    Write-Host "[skip]  $Label tidak berjalan di port $Port"
    return
  }

  foreach ($procId in $pids) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
      Write-Host "[stop]  $Label - PID $procId ($($proc.ProcessName)) port $Port"
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
}

# --- Frontend + API -------------------------------------------------------

Stop-ByPort $WebPort "Frontend (PHP)"
Stop-ByPort $ApiPort "API (Node)"

# --- MariaDB (graceful) ---------------------------------------------------

$mysqladmin = Join-Path $MysqlHome "bin\mysqladmin.exe"
if (Test-Path $mysqladmin) {
  Write-Host "[stop]  MariaDB (mysqladmin shutdown)"
  & $mysqladmin -u root -h 127.0.0.1 -P 3306 shutdown 2>&1 | Out-Null
  Start-Sleep -Seconds 2
}

Get-Process mysqld -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host "[stop]  sisa proses mysqld - PID $($_.Id)"
  Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Semua server dihentikan."
