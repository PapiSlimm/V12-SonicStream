# ============================================================
#  SONICSTREAM STABILIZATION SCRIPT
#  Run:  powershell -ExecutionPolicy Bypass -File stabilize-sonicstream.ps1
#
#  Does, step by step (each step asks before running):
#    0. Show what is actually live (services, URLs, domain DNS)
#    1. Stripe TEST keys  -> Secret Manager
#    2. Stripe webhook    -> Secret Manager (correct endpoint: /api/webhooks/stripe)
#    3. Rotate the Cloud SQL database password (keeps host format intact)
#    4. Create the shared V12 ECOSYSTEM_SECRET
#    5. Roll new revisions so services pick everything up
#    6. Health check
#
#  Secrets are typed into this window and sent straight to Google Secret
#  Manager. Nothing is written to disk. Never paste secrets into chat.
# ============================================================
$ErrorActionPreference = "Stop"
$PROJECT = "gen-lang-client-0237733980"
$REGION  = "us-east1"

function Ask([string]$q) { (Read-Host "$q (y/n)") -match '^[Yy]' }
function Add-SecretVersion([string]$name, [string]$value) {
  $tmp = New-TemporaryFile
  try {
    [IO.File]::WriteAllText($tmp.FullName, $value)  # no trailing newline
    $exists = gcloud secrets describe $name 2>$null
    if (-not $exists) { gcloud secrets create $name --data-file="$($tmp.FullName)" }
    else { gcloud secrets versions add $name --data-file="$($tmp.FullName)" }
  } finally { Remove-Item $tmp.FullName -Force }
}

Write-Host "`n=== SonicStream stabilization ===" -ForegroundColor Cyan
gcloud config set project $PROJECT | Out-Null

# ---------- STEP 0: what is actually live ----------
Write-Host "`n--- STEP 0: current state ---" -ForegroundColor Yellow
gcloud run services list --region $REGION --filter="metadata.name~sonicstream-" `
  --format="table(metadata.name,status.url,status.conditions[0].status)"
$SERVER_URL = (gcloud run services describe sonicstream-server --region $REGION --format="value(status.url)")
Write-Host "API server URL: $SERVER_URL"
foreach ($d in @("sonicstream.v12multimedia.com", "v12multimedia.com")) {
  try { Resolve-DnsName $d -ErrorAction Stop | Out-Null; Write-Host "DNS OK:      $d" -ForegroundColor Green }
  catch { Write-Host "NO DNS:      $d  (domain not mapped / not registered - app is only reachable at the run.app URL)" -ForegroundColor Red }
}

# ---------- STEP 1: Stripe TEST keys ----------
if (Ask "`nSTEP 1: Set Stripe TEST keys now? (Dashboard must be in Test mode - toggle top-right)") {
  Write-Host "Stripe Dashboard -> Developers -> API keys -> copy the SECRET key (starts sk_test_)"
  $sk = Read-Host "Paste sk_test_ key"
  if (-not $sk.StartsWith("sk_test_")) { Write-Host "That is not a TEST secret key (must start sk_test_). Skipping." -ForegroundColor Red }
  else {
    Add-SecretVersion "sonicstream-stripe" $sk
    Write-Host "Now create two recurring Products in the Dashboard (Test mode) -> Product catalog:"
    Write-Host "  'SonicStream Pro' and 'SonicStream Enterprise' -> copy each price id (price_...)"
    $pro = Read-Host "Paste PRO price id (price_...)"
    $ent = Read-Host "Paste ENTERPRISE price id (price_...)"
    if ($pro.StartsWith("price_")) { Add-SecretVersion "sonicstream-price-pro" $pro }
    if ($ent.StartsWith("price_")) { Add-SecretVersion "sonicstream-price-enterprise" $ent }
    Write-Host "Stripe test keys stored." -ForegroundColor Green
  }
}

# ---------- STEP 2: Stripe webhook ----------
if (Ask "`nSTEP 2: Register the Stripe webhook?") {
  Write-Host "Stripe Dashboard (Test mode) -> Developers -> Webhooks -> Add endpoint:"
  Write-Host "  $SERVER_URL/api/webhooks/stripe" -ForegroundColor Cyan
  Write-Host "  (exactly this path - NOT /api/payments/webhook)"
  Write-Host "Events: checkout.session.completed, customer.subscription.created/updated/deleted,"
  Write-Host "        invoice.payment_succeeded, invoice.payment_failed, payment_intent.payment_failed, payout.paid"
  $wh = Read-Host "Paste the endpoint's signing secret (whsec_...)"
  if ($wh.StartsWith("whsec_")) { Add-SecretVersion "sonicstream-stripe-webhook" $wh; Write-Host "Webhook secret stored." -ForegroundColor Green }
  else { Write-Host "Not a whsec_ value. Skipping." -ForegroundColor Red }
}

# ---------- STEP 3: rotate DB password ----------
if (Ask "`nSTEP 3: Rotate the database password?") {
  $chars = [char[]]([char]'a'..[char]'z') + [char[]]([char]'A'..[char]'Z') + [char[]]([char]'0'..[char]'9')
  $newPw = -join (1..32 | ForEach-Object { $chars | Get-Random })
  $current = (gcloud secrets versions access latest --secret=sonicstream-db)
  # postgresql://appuser:OLDPW@host... -> replace only the password segment
  $updated = $current -replace '(postgresql://[^:]+:)[^@]*(@)', "`${1}$newPw`${2}"
  if ($updated -eq $current) { Write-Host "Could not locate password in connection string - NOT rotating. Paste the secret format to Claude (redact the password)." -ForegroundColor Red }
  else {
    Write-Host "Setting new password on Cloud SQL user 'appuser'..."
    gcloud sql users set-password appuser --instance=sonicstream-pg --password=$newPw
    Add-SecretVersion "sonicstream-db" $updated
    Write-Host "DB password rotated + secret updated (host format preserved)." -ForegroundColor Green
    Write-Host "Rollback if needed: gcloud secrets versions list sonicstream-db  (previous version still exists)"
  }
}

# ---------- STEP 4: ecosystem secret ----------
if (Ask "`nSTEP 4: Create the shared ECOSYSTEM_SECRET (for V12 app interconnect)?") {
  $eco = -join (1..64 | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
  Add-SecretVersion "sonicstream-ecosystem" $eco
  Write-Host "Created secret 'sonicstream-ecosystem'. When V12 core deploys, give it the SAME value" -ForegroundColor Green
  Write-Host "(read it with: gcloud secrets versions access latest --secret=sonicstream-ecosystem)"
}

# ---------- STEP 5: roll new revisions ----------
if (Ask "`nSTEP 5: Roll new revisions so all services pick up the new secrets?") {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Write-Host "Updating sonicstream-server (adds ecosystem secret + payments flag)..."
  gcloud run services update sonicstream-server --region $REGION `
    --update-secrets "ECOSYSTEM_SECRET=sonicstream-ecosystem:latest" `
    --update-env-vars "ENABLE_PAYMENTS=true,APP_ID=sonicstream,STABILIZED_AT=$stamp"
  foreach ($svc in @("sonicstream-worker", "sonicstream-scheduler")) {
    Write-Host "Bumping $svc to pick up the rotated DB secret..."
    gcloud run services update $svc --region $REGION --update-env-vars "STABILIZED_AT=$stamp"
  }
  Write-Host "All services rolled." -ForegroundColor Green
}

# ---------- STEP 6: health check ----------
Write-Host "`n--- STEP 6: health check ---" -ForegroundColor Yellow
try {
  $h = Invoke-WebRequest "$SERVER_URL/health/live" -UseBasicParsing -TimeoutSec 20
  Write-Host "health/live -> $($h.StatusCode)" -ForegroundColor Green
} catch { Write-Host "health/live FAILED: $($_.Exception.Message)  - copy this to Claude" -ForegroundColor Red }
Write-Host "`nDone. Remaining manual steps are in STABILIZE_CHECKLIST.md (Google sign-in is console-only)." -ForegroundColor Cyan
