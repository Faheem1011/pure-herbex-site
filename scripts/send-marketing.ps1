# Send herbex_marketing template to specific numbers — no inbox UI.
# Usage:
#   $env:INBOX_PASSWORD = "your-inbox-password"
#   .\scripts\send-marketing.ps1 -TargetsFile .\scripts\marketing-targets.json
# Or inline numbers:
#   .\scripts\send-marketing.ps1 -Phones "923001234567","923009876543"

param(
  [string]$ApiBase = "https://pure-herbex-site.vercel.app",
  [string]$TargetsFile = "",
  [string[]]$Phones = @(),
  [string]$Password = $env:INBOX_PASSWORD,
  [string]$Line = "main"
)

$ErrorActionPreference = "Stop"

if (-not $Password) {
  Write-Error "Set INBOX_PASSWORD env var or pass -Password"
}

$body = @{
  templateName = "herbex_marketing"
  languageCode = "en"
  bodyVarCount = 0
  line = $Line
  targets = @()
}

if ($TargetsFile) {
  if (-not (Test-Path $TargetsFile)) {
    Write-Error "File not found: $TargetsFile"
  }
  $json = Get-Content $TargetsFile -Raw | ConvertFrom-Json
  if ($json.templateName) { $body.templateName = $json.templateName }
  if ($json.languageCode) { $body.languageCode = $json.languageCode }
  if ($json.line) { $body.line = $json.line }
  foreach ($t in $json.targets) {
    $name = if ($t.name) { [string]$t.name } else { "Customer" }
    $body.targets += @{ phone = [string]$t.phone; name = $name }
  }
} elseif ($Phones.Count -gt 0) {
  foreach ($p in $Phones) {
    $body.targets += @{ phone = $p; name = "Customer" }
  }
} else {
  Write-Error "Provide -TargetsFile or -Phones"
}

if ($body.targets.Count -eq 0) {
  Write-Error "No targets to send"
}

Write-Host "Sending $($body.templateName) to $($body.targets.Count) number(s)..."

$uri = "$ApiBase/api/campaign/"
$headers = @{
  Authorization = "Bearer $Password"
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body ($body | ConvertTo-Json -Depth 5)

Write-Host ""
Write-Host "Status: $($response.status)"
Write-Host "Sent: $($response.sent)  Failed: $($response.failed)  Skipped: $($response.skipped)"

if ($response.results) {
  foreach ($r in $response.results) {
    $line = "+$($r.phone) -> $($r.status)"
    if ($r.error) { $line += " ($($r.error))" }
    if ($r.reason) { $line += " ($($r.reason))" }
    Write-Host "  $line"
  }
}

if ($response.firstError) {
  Write-Host "First error: $($response.firstError)" -ForegroundColor Yellow
}
