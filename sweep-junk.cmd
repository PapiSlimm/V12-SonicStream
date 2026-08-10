@echo off
REM One-shot cleanup: moves stray junk files (accidental terminal output saved
REM as files) into _to_delete\ for you to review and delete. Touches nothing else.
cd /d "%~dp0"
if not exist "_to_delete" mkdir "_to_delete"

for %%F in (
  "11cedc39e663"
  "12.0.2"
  "1e64152bf1ba"
  "22'"
  "8e80f02e94a5"
  "9f16948e3e41"
  "adfd2b85ac75"
  "dfdee860afbe"
  "npm"
  "rm"
  "Running"
  "v12-sonicstream@12.0.0"
  "vite"
) do (
  if exist "%%~F" (
    move /Y "%%~F" "_to_delete\" >nul && echo   moved: %%~F
  )
)

echo.
echo Done. Review _to_delete\ and delete the folder when satisfied.
pause
del "%~f0"
