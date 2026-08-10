# SonicStream — DEPLOY RUNBOOK (Cloud Run, replacing the AI Studio deployment)

Run these once, in order, from a terminal with the repo unzipped. Paste any error
output back to Claude for troubleshooting. Your old AI Studio-published service
stays running untouched until §7 — it is your rollback.

## 1. Tooling & project (5 min)
```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud config set project YOUR_PROJECT_ID   # the SAME project AI Studio publishes to
gcloud config set run/region us-east1
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  redis.googleapis.com sqladmin.googleapis.com
gcloud artifacts repositories create sonicstream --repository-format=docker \
  --location=us-east1 2>/dev/null || true
```

## 2. Postgres (Cloud SQL) (10 min)
```bash
gcloud sql instances create sonicstream-pg --database-version=POSTGRES_16 \
  --tier=db-g1-small --region=us-east1
gcloud sql databases create sonicstream --instance=sonicstream-pg
gcloud sql users create appuser --instance=sonicstream-pg --password='CHOOSE_STRONG_PW'
```
Connection string for §4:
`postgresql://appuser:CHOOSE_STRONG_PW@/sonicstream?host=/cloudsql/YOUR_PROJECT_ID:us-east1:sonicstream-pg`
(and add `--add-cloudsql-instances YOUR_PROJECT_ID:us-east1:sonicstream-pg` to each
`gcloud run deploy` — or use the instance's public IP with authorized networks to start.)

## 3. Redis (Memorystore) (10 min)
```bash
gcloud redis instances create sonicstream-redis --size=1 --region=us-east1 \
  --redis-version=redis_7_0
gcloud redis instances describe sonicstream-redis --region=us-east1 \
  --format='value(host,port)'
```
Memorystore is VPC-only: create a connector once and add
`--vpc-connector sonicstream-vpc` to the deploys (Claude can wire this into the
script when you reach this step):
```bash
gcloud compute networks vpc-access connectors create sonicstream-vpc \
  --region=us-east1 --range=10.8.0.0/28
```

## 4. Secrets (10 min)
```bash
create_secret () { printf '%s' "$2" | gcloud secrets create "$1" --data-file=- 2>/dev/null \
  || printf '%s' "$2" | gcloud secrets versions add "$1" --data-file=-; }

create_secret sonicstream-db          'postgresql://appuser:...'
create_secret sonicstream-redis      'redis://10.x.x.x:6379'
create_secret sonicstream-jwt         "$(openssl rand -hex 48)"
create_secret sonicstream-jwt-refresh "$(openssl rand -hex 48)"
create_secret sonicstream-gemini      'YOUR_GEMINI_API_KEY'
create_secret sonicstream-stripe      'sk_live_...'
create_secret sonicstream-stripe-webhook 'whsec_...'      # from §6
create_secret sonicstream-price-pro   'price_...'
create_secret sonicstream-price-enterprise 'price_...'
create_secret sonicstream-gcs-bucket  'your-gcs-bucket-name'
create_secret sonicstream-public-url  'https://yourdomain.com'
```
Grant the Cloud Run runtime account access:
```bash
PN=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PN}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 5. Deploy all three services
```bash
./cloud-run-deploy.sh all
```
Verify each: open `<server-url>/health/live`, then check logs:
```bash
gcloud run services logs read sonicstream-scheduler --region=us-east1 --limit=20
```
Expect: `[SchedulerService] Scheduler Service ready.` and (once enabled)
`[AutoPilot] Starting: 10 cycles/hour`.

## 6. Stripe webhooks (5 min)
In the Stripe Dashboard → Webhooks → Add endpoint:
`https://<sonicstream-server-url>/api/webhooks/stripe`
(NOT `/api/payments/webhook` — that route sits behind the JSON body parser, so
Stripe's signature verification fails there. `/api/webhooks/stripe` is mounted
before the parser and receives the raw body.)
Copy the signing secret → update the `sonicstream-stripe-webhook` secret (§4) →
redeploy server: `./cloud-run-deploy.sh server`.

## 7. Domain cutover (the moment of launch)
```bash
gcloud beta run domain-mappings create --service sonicstream-server \
  --domain yourdomain.com --region us-east1
```
Update the DNS records it prints. Once verified and serving, the old AI
Studio-published service is idle — leave it a week as rollback, then delete it:
```bash
gcloud run services delete OLD_AI_STUDIO_SERVICE_NAME --region=us-east1
```

## 8. Turn on AutoPilot (deliberate, after everything else is green)
```bash
ENABLE_AUTOPILOT=true ./cloud-run-deploy.sh scheduler
```
Cost reminder: ~480 Gemini calls/day at 10 cycles/hour. Watch the first hour:
`gcloud run services logs tail sonicstream-scheduler --region=us-east1`
