#!/bin/bash
# ============================================================================
# SonicStream — three-service Cloud Run deployment
# Usage:
#   ./cloud-run-deploy.sh all              # deploy server + worker + scheduler
#   ./cloud-run-deploy.sh server|worker|scheduler
#
# Prereqs (one-time — see DEPLOY_RUNBOOK.md):
#   gcloud auth login && gcloud config set project <PROJECT_ID>
#   Secrets created in Secret Manager, Redis + Postgres provisioned.
# ============================================================================
set -euo pipefail

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="${REGION:-us-east1}"   # matches the original AI Studio deployment region
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/sonicstream/app:$(date +%Y%m%d-%H%M%S)"
TARGET="${1:-all}"

if [ -z "$PROJECT_ID" ]; then echo "❌ No gcloud project set. Run: gcloud config set project <id>"; exit 1; fi

# Every secret the app now requires. Missing ones fail here, not at runtime.
SECRETS="DATABASE_URL=sonicstream-db:latest,\
REDIS_URL=sonicstream-redis:latest,\
JWT_SECRET=sonicstream-jwt:latest,\
JWT_REFRESH_SECRET=sonicstream-jwt-refresh:latest,\
GEMINI_API_KEY=sonicstream-gemini:latest,\
STRIPE_SECRET_KEY=sonicstream-stripe:latest,\
STRIPE_WEBHOOK_SECRET=sonicstream-stripe-webhook:latest,\
STRIPE_PRICE_PRO=sonicstream-price-pro:latest,\
STRIPE_PRICE_ENTERPRISE=sonicstream-price-enterprise:latest,\
GCS_BUCKET=sonicstream-gcs-bucket:latest,\
PUBLIC_BASE_URL=sonicstream-public-url:latest"

echo "▶ Building image via Cloud Build: ${IMAGE}"
gcloud builds submit --tag "${IMAGE}" --timeout=1200 .

deploy_service () {
  local ROLE=$1 MEMORY=$2 CPU=$3 MIN=$4 MAX=$5 EXTRA=$6
  echo "▶ Deploying sonicstream-${ROLE} (${MEMORY}/${CPU}cpu, min=${MIN})"
  # shellcheck disable=SC2086
  gcloud run deploy "sonicstream-${ROLE}" \
    --image "${IMAGE}" \
    --region "${REGION}" \
    --platform managed \
    --memory "${MEMORY}" --cpu "${CPU}" \
    --min-instances "${MIN}" --max-instances "${MAX}" \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,SONIC_ROLE=${ROLE},ENABLE_AUTOPILOT=${ENABLE_AUTOPILOT:-false}" \
    --set-secrets "${SECRETS}" \
    ${EXTRA}
  echo "✅ sonicstream-${ROLE} deployed"
}

case "$TARGET" in
  server|all)
    # Public API + client. Scales with traffic; can go to zero if you accept cold starts.
    deploy_service server 2Gi 2 "${SERVER_MIN:-1}" 10 "--allow-unauthenticated"
    ;;& 
  worker|all)
    # Background jobs (ffmpeg, AI, payouts). MUST be pinned + CPU always-on:
    # Cloud Run throttles CPU to ~0 outside requests, which starves BullMQ consumers.
    deploy_service worker 2Gi 2 1 3 "--no-allow-unauthenticated --no-cpu-throttling"
    ;;&
  scheduler|all)
    # AutoPilot + RSS timers. min-instances=1 + no-cpu-throttling are NON-NEGOTIABLE:
    # without them the service scales to zero and every setInterval silently dies.
    deploy_service scheduler 1Gi 1 1 1 "--no-allow-unauthenticated --no-cpu-throttling"
    ;;
esac

echo ""
echo "▶ Service URLs:"
gcloud run services list --region "${REGION}" --filter="metadata.name~sonicstream" --format="table(metadata.name,status.url)"
echo ""
echo "Next: point Stripe webhooks at <server-url>/api/payments/webhook and map your domain (see DEPLOY_RUNBOOK.md §6-7)."
