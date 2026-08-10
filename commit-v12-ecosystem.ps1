# ============================================================
#  V12 ECOSYSTEM COMMIT PASS - 2026-08-10
#  Run:  powershell -ExecutionPolicy Bypass -File commit-v12-ecosystem.ps1
#
#  For each app: initializes git where missing, makes sure secrets and
#  runtime files are ignored, and commits today's work with a descriptive
#  message. Nothing is pushed unless you say yes at the end.
# ============================================================
$ErrorActionPreference = "Continue"
$desktop = "$env:USERPROFILE\Desktop"

$repos = @(
  @{ Path = "SONIC STREAM";   Msg = "Ecosystem bus + V12 Constitution enforcement + feed syndication publisher/intake; Stripe webhook path fix; stabilization scripts" },
  @{ Path = "V12 WEB";        Msg = "V12 Constitution enforcement (anchored engine, Article X routes, ADMIN_EMAILS authority)" },
  @{ Path = "RM PM";          Msg = "Marketing loop: ecosystem feed intake + Sentinel-classified reviews, suggestion channel to SonicStream, campaign engine with City World + Inspectorate launch gates" },
  @{ Path = "SOCIOFY";        Msg = "Ecosystem: real feed-post handlers for SonicStream tracks/media; rmpm registered; marketing.campaign.launched event added to contract" },
  @{ Path = "CEOS";           Msg = "Ecosystem consumers: SonicStream tracks/media and R.M.P.M campaigns -> Creator Economy Feed + V12 Marketplace cards" },
  @{ Path = "ORION PRIME";    Msg = "V12 feed intake mounted (signed envelope inbox for City World evidence)" },
  @{ Path = "V12 APEX ATLAS"; Msg = "V12 feed intake mounted (signed envelope inbox as Atlas admission-review queue)" }
)

# Safety net: these must never be committed, in any repo.
$ignoreLines = @(
  "node_modules/", "dist/", ".env", ".env.local", ".env.production",
  "*.db", "*.sqlite", "*.log", "uploads/", "_to_delete/",
  "ecosystem-inbox.jsonl", "rmpm-ecosystem-inbox.jsonl", "rmpm-campaigns.jsonl",
  "__pycache__/", "*.pyc", ".pytest_cache/"
)

$summary = @()
foreach ($repo in $repos) {
  $dir = Join-Path $desktop $repo.Path
  if (-not (Test-Path $dir)) { $summary += "SKIP  $($repo.Path) - folder not found"; continue }
  Push-Location $dir
  try {
    if (-not (Test-Path ".git")) {
      git init -b main | Out-Null
      Write-Host "Initialized git in $($repo.Path)" -ForegroundColor Yellow
    }

    # Idempotently append missing ignore rules BEFORE staging anything.
    if (-not (Test-Path ".gitignore")) { New-Item .gitignore -ItemType File | Out-Null }
    $existing = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    $added = @()
    foreach ($line in $ignoreLines) {
      if ($existing -notcontains $line) { Add-Content ".gitignore" $line; $added += $line }
    }
    if ($added.Count -gt 0) { Write-Host "  .gitignore += $($added -join ', ')" -ForegroundColor DarkGray }

    # If .env was EVER tracked in this repo, untrack it now (keeps the file on disk).
    git rm --cached .env 2>$null | Out-Null

    git add -A
    $pending = git status --porcelain
    if ([string]::IsNullOrWhiteSpace(($pending -join ""))) {
      $summary += "CLEAN $($repo.Path) - nothing to commit"
    } else {
      git commit -m $repo.Msg -m "Committed by the 2026-08-10 ecosystem wiring session (Claude-assisted)." | Out-Null
      $hash = git rev-parse --short HEAD
      $count = ($pending | Measure-Object).Count
      $summary += "OK    $($repo.Path) - $count files @ $hash"
      Write-Host "Committed $($repo.Path) ($count files)" -ForegroundColor Green
    }
  } catch {
    $summary += "ERROR $($repo.Path) - $($_.Exception.Message)"
  } finally { Pop-Location }
}

Write-Host "`n===== SUMMARY =====" -ForegroundColor Cyan
$summary | ForEach-Object { Write-Host "  $_" }

# Optional: push SONIC STREAM to its (currently empty) GitHub repo.
Write-Host ""
$push = Read-Host "Push SONIC STREAM to github.com/PapiSlimm/V12-SonicStream now? (y/n)"
if ($push -match '^[Yy]') {
  Push-Location (Join-Path $desktop "SONIC STREAM")
  try {
    $hasRemote = git remote | Select-String -Quiet "origin"
    if (-not $hasRemote) { git remote add origin https://github.com/PapiSlimm/V12-SonicStream.git }
    git push -u origin main
    Write-Host "Pushed. Your code now survives this computer." -ForegroundColor Green
  } catch {
    Write-Host "Push failed: $($_.Exception.Message) - copy this to Claude." -ForegroundColor Red
  } finally { Pop-Location }
}
Write-Host "`nDone. Tip: push the other repos too once their remotes exist."
