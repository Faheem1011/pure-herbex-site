# Generate a new inbox password and write it to .env (gitignored).
# After running, update Vercel: Project → Settings → Environment Variables → INBOX_PASSWORD
# Then redeploy. Everyone must log in again (browser localStorage / Android app).

param(
  [string]$NewPassword = "",
  [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $root $EnvFile

if (-not $NewPassword) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $NewPassword = [Convert]::ToBase64String($bytes) -replace '[+/=]', ''
}

$line = "INBOX_PASSWORD=`"$NewPassword`""
if (Test-Path $envPath) {
  $content = Get-Content $envPath -Raw
  if ($content -match '(?m)^INBOX_PASSWORD=') {
    $content = $content -replace '(?m)^INBOX_PASSWORD=.*$', $line
  } else {
    $content = $line + "`n" + $content
  }
  Set-Content -Path $envPath -Value $content.TrimEnd() -NoNewline
  Add-Content -Path $envPath -Value ""
} else {
  Set-Content -Path $envPath -Value $line
}

Write-Host ""
Write-Host "New INBOX_PASSWORD saved to $EnvFile"
Write-Host ""
Write-Host "Password: $NewPassword"
Write-Host ""
Write-Host "Vercel (new project):"
Write-Host "  https://vercel.com/pure-herbex/pure-herbex-site/settings/environment-variables"
Write-Host "  Set INBOX_PASSWORD for Production, Preview, Development → Redeploy"
Write-Host ""
Write-Host "Local marketing script:"
Write-Host "  `$env:INBOX_PASSWORD = `"$NewPassword`""
Write-Host ""
