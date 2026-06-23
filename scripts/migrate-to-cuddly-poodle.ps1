# Copy all data: pure-herbex-kv-2 (liked-mole) -> kv_Herbex_new_Database3 (cuddly-poodle)
#
# BEFORE running:
# 1. Vercel -> Storage -> kv_Herbex_new_Database3 -> "Connect to Project" -> pure-herbex-site
# 2. Upstash console -> cuddly-poodle-102740 -> REST API -> copy UPSTASH_REDIS_REST_TOKEN
#
# Usage:
#   .\scripts\migrate-to-cuddly-poodle.ps1 -DestToken "paste-token-here"
# Or:
#   $env:DEST_KV_REST_API_TOKEN = "paste-token-here"
#   .\scripts\migrate-to-cuddly-poodle.ps1

param(
  [string]$SourceToken = $env:SOURCE_KV_REST_API_TOKEN,
  [string]$DestToken = $env:DEST_KV_REST_API_TOKEN
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$sourceUrl = "https://liked-mole-100771.upstash.io"
$destUrl = "https://cuddly-poodle-102740.upstash.io"

if (-not $SourceToken) {
  Write-Host "Source token missing. Get it from Upstash -> pure-herbex-kv-2 -> REST API tab."
  exit 1
}
if (-not $DestToken) {
  Write-Host "Dest token missing. Connect kv_Herbex_new_Database3 to Vercel, then copy KV_REST_API_TOKEN from project env vars or Upstash REST API tab."
  exit 1
}

function Test-KvPing([string]$Url, [string]$Token) {
  $headers = @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" }
  $r = Invoke-RestMethod -Uri $Url -Method POST -Headers $headers -Body '["PING"]'
  return $r.result -eq "PONG"
}

Write-Host "Testing source (liked-mole)..."
if (-not (Test-KvPing $sourceUrl $SourceToken)) {
  Write-Error "Source database auth failed. Copy token from Upstash -> pure-herbex-kv-2 -> REST API."
}

Write-Host "Testing destination (cuddly-poodle)..."
if (-not (Test-KvPing $destUrl $DestToken)) {
  Write-Error "Destination auth failed. Click Connect to Project on Vercel Storage, then copy a fresh REST token from Upstash."
}

$env:SOURCE_KV_REST_API_URL = $sourceUrl
$env:SOURCE_KV_REST_API_TOKEN = $SourceToken
$env:DEST_KV_REST_API_URL = $destUrl
$env:DEST_KV_REST_API_TOKEN = $DestToken

Push-Location $root
try {
  npx --yes tsx scripts/migrate-kv.ts
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host ""
  Write-Host "Migration OK. Update Vercel env vars (or keep integration-linked KV) and redeploy."
  Write-Host "  KV_REST_API_URL = $destUrl"
  Write-Host "  EXPECTED_KV_HOST = cuddly-poodle-102740.upstash.io"
} finally {
  Pop-Location
}
