@echo off
setlocal
REM ============================================================
REM  SONICSTREAM LAUNCH SCRIPT - builds the app in Google Cloud
REM  and deploys all three services (server, worker, scheduler).
REM  Run this FROM INSIDE the extracted code folder.
REM ============================================================
set PROJECT=gen-lang-client-0237733980
set REGION=us-east1
set IMAGE=us-east1-docker.pkg.dev/%PROJECT%/sonicstream/app:v1
set SQLCONN=%PROJECT%:us-east1:sonicstream-pg
REM ECOSYSTEM_SECRET added 2026-08-10: run stabilize-sonicstream.ps1 step 4 first
REM (it creates the sonicstream-ecosystem secret) or this deploy fails on a
REM missing secret reference.
set SECRETS=DATABASE_URL=sonicstream-db:latest,REDIS_URL=sonicstream-redis:latest,JWT_SECRET=sonicstream-jwt:latest,JWT_REFRESH_SECRET=sonicstream-jwt-refresh:latest,GEMINI_API_KEY=sonicstream-gemini:latest,STRIPE_SECRET_KEY=sonicstream-stripe:latest,STRIPE_WEBHOOK_SECRET=sonicstream-stripe-webhook:latest,STRIPE_PRICE_PRO=sonicstream-price-pro:latest,STRIPE_PRICE_ENTERPRISE=sonicstream-price-enterprise:latest,GCS_BUCKET=sonicstream-gcs-bucket:latest,PUBLIC_BASE_URL=sonicstream-public-url:latest,ECOSYSTEM_SECRET=sonicstream-ecosystem:latest

echo.
echo  === STEP 0: sanity check ===
if not exist Dockerfile.prod (
  echo  ERROR: Dockerfile.prod not found. You must run this from inside
  echo  the extracted v12-sonicstream folder. Use: cd C:\v12\sonicstream
  pause & exit /b 1
)
copy /Y Dockerfile.prod Dockerfile >nul
echo  OK - running from the right folder.

echo.
REM STEP 1 REMOVED (2026-07-27): this step used to re-file the sonicstream-db
REM secret in socket format on every deploy - silently overwriting the working
REM private-IP address and re-breaking the database each time. The secret is now
REM managed manually and deploys must never touch it.

echo  === STEP 2: building your app in Google Cloud (10-20 minutes) ===
call gcloud builds submit --tag %IMAGE% --timeout=1500 .
if errorlevel 1 ( echo BUILD FAILED - copy the red text above to Claude. & pause & exit /b 1 )

echo.
echo  === STEP 3: deploying the API server ===
call gcloud run deploy sonicstream-server --image %IMAGE% --region %REGION% --platform managed --memory 2Gi --cpu 2 --min-instances 1 --max-instances 10 --port 8080 --allow-unauthenticated --vpc-connector sonicstream-vpc --add-cloudsql-instances %SQLCONN% --set-env-vars "NODE_ENV=production,SONIC_ROLE=server,ENABLE_AUTOPILOT=false,RUN_BOOTSTRAP=1,ENABLE_PAYMENTS=true,APP_ID=sonicstream" --set-secrets "%SECRETS%"

echo.
echo  === STEP 4: deploying the background worker ===
call gcloud run deploy sonicstream-worker --image %IMAGE% --region %REGION% --platform managed --memory 2Gi --cpu 2 --min-instances 1 --max-instances 3 --port 8080 --no-allow-unauthenticated --no-cpu-throttling --vpc-connector sonicstream-vpc --add-cloudsql-instances %SQLCONN% --set-env-vars "NODE_ENV=production,SONIC_ROLE=worker,ENABLE_AUTOPILOT=false" --set-secrets "%SECRETS%"

echo.
echo  === STEP 5: deploying the scheduler ===
call gcloud run deploy sonicstream-scheduler --image %IMAGE% --region %REGION% --platform managed --memory 1Gi --cpu 1 --min-instances 1 --max-instances 1 --port 8080 --no-allow-unauthenticated --no-cpu-throttling --vpc-connector sonicstream-vpc --add-cloudsql-instances %SQLCONN% --set-env-vars "NODE_ENV=production,SONIC_ROLE=scheduler,ENABLE_AUTOPILOT=false" --set-secrets "%SECRETS%"

echo.
echo  === YOUR SERVICES: ===
call gcloud run services list --region %REGION% --filter="metadata.name~sonicstream-" --format="table(metadata.name,status.url)"
echo.
echo  Open the sonicstream-server URL in your browser - that is your live app.
pause
