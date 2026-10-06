@echo off
REM ============================================================
REM  OPTIONAL EXTRA SAVINGS (~$25-30/mo more) - run ONCE, any time
REM  AFTER the lean deploy is green. Downsizes the Postgres
REM  instance one tier (db-g1-small -> db-f1-micro). Fine for
REM  early launch; upgrade back with one command when users grow.
REM  CAUSES ~2-5 MIN DATABASE RESTART - run at a quiet hour.
REM ============================================================
echo This restarts the database for a few minutes. Press Ctrl+C to cancel, or
pause
call gcloud sql instances patch sonicstream-pg --tier=db-f1-micro
echo Done. Both apps reconnect automatically.
pause
