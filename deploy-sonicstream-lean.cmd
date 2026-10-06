@echo off
setlocal
REM ============================================================
REM  SONICSTREAM LEAN DEPLOY (2026-09-27) - THE BUDGET FIX
REM  Replaces 3 always-on services (5 vCPU / 5 GiB, ~$280-330/mo
REM  Cloud Run alone) with ONE service running SONIC_ROLE=all
REM  (server+worker+scheduler in one process, 1 vCPU / 1 GiB,
REM  ~$55-65/mo). Same code, same features, ~80% less burn.
REM
REM  max-instances=1 is REQUIRED: the scheduler lives inside this
REM  process, and two instances would double-run billing jobs.
REM  (One instance comfortably serves early launch traffic;
REM  when you outgrow it, we split the roles again - that is a
REM  good problem.)
REM
REM  Run FROM INSIDE C:\v12launch:  deploy-sonicstream-lean.cmd
REM ============================================================
set PROJECT=gen-lang-client-0237733980
set REGION=us-east1
set IMAGE=us-east1-docker.pkg.dev/%PROJECT%/sonicstream/app:v1
set SQLCONN=%PROJECT%:us-east1:sonicstream-pg
set SECRETS=DATABASE_URL=sonicstream-db:latest,REDIS_URL=sonicstream-redis:latest,JWT_SECRET=sonicstream-jwt:latest,JWT_REFRESH_SECRET=sonicstream-jwt-refresh:latest,GEMINI_API_KEY=sonicstream-gemini:latest,STRIPE_SECRET_KEY=sonicstream-stripe:latest,STRIPE_WEBHOOK_SECRET=sonicstream-stripe-webhook:latest,STRIPE_PRICE_PRO=sonicstream-price-pro:latest,STRIPE_PRICE_ENTERPRISE=sonicstream-price-enterprise:latest,GCS_BUCKET=sonicstream-gcs-bucket:latest,MINIMAX_API_KEY=sonicstream-minimax:latest,PUBLIC_BASE_URL=sonicstream-public-url:latest

echo.
echo  === STEP 0: sanity check ===
if not exist Dockerfile.prod (
  echo  ERROR: run this from inside C:\v12launch
  pause & exit /b 1
)
copy /Y Dockerfile.prod Dockerfile >nul
echo  OK.

echo.
echo  === STEP 1: building in Google Cloud (10-20 min) ===
call gcloud builds submit --tag %IMAGE% --timeout=1500 .
if errorlevel 1 ( echo BUILD FAILED - copy the red text above to Claude. & pause & exit /b 1 )

echo.
echo  === STEP 2: deploying the ONE consolidated service ===
call gcloud run deploy sonicstream-server --image %IMAGE% --region %REGION% --platform managed --memory 1Gi --cpu 1 --min-instances 1 --max-instances 1 --no-cpu-throttling --port 8080 --allow-unauthenticated --vpc-connector sonicstream-vpc --add-cloudsql-instances %SQLCONN% --set-env-vars "NODE_ENV=production,SONIC_ROLE=all,ENABLE_AUTOPILOT=false,RUN_BOOTSTRAP=1" --set-secrets "%SECRETS%"
if errorlevel 1 ( echo DEPLOY FAILED - copy the red text above to Claude. & pause & exit /b 1 )

echo.
echo  === STEP 3: deleting the 2 redundant always-on services (the money leak) ===
call gcloud run services delete sonicstream-worker --region %REGION% --quiet
call gcloud run services delete sonicstream-scheduler --region %REGION% --quiet

echo.
echo  === DONE. Your app: ===
call gcloud run services list --region %REGION% --filter="metadata.name~sonicstream" --format="table(metadata.name,status.url)"
echo.
echo  Test: open the URL + /health/ready  (expect ready:true)
pause
