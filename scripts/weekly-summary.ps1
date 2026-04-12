$ErrorActionPreference = "Stop"

$url = $env:CALMA_WEEKLY_URL
if (-not $url) {
  Write-Error "CALMA_WEEKLY_URL not set"
  exit 1
}

$token = $env:CALMA_WEEKLY_TOKEN
if (-not $token) {
  Write-Error "CALMA_WEEKLY_TOKEN not set"
  exit 1
}

$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Method Post -Uri $url -Headers $headers | Out-String
