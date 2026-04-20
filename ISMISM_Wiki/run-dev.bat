@echo off
setlocal enabledelayedexpansion

set "APP_DIR=%~dp0ismism-wiki-app"
cd /d "%APP_DIR%"

if not exist "package.json" (
  echo Could not find "ismism-wiki-app\package.json".
  echo Make sure this file stays in the repository root.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is not available in PATH.
  echo Install Node.js and reopen your terminal/session.
  pause
  exit /b 1
)

if "%ISMISM_SOURCE_DIR%"=="" (
  set "DEFAULT_SOURCE=%~dp0ismism-wiki-main\ismism-wiki-main"
  if exist "%DEFAULT_SOURCE%" (
    set "ISMISM_SOURCE_DIR=%DEFAULT_SOURCE%"
  ) else (
    set "ISMISM_SOURCE_DIR="
    echo ISMISM_SOURCE_DIR not found at default location.
    echo Starting without re-indexing to keep existing entry content.
  )
)

rem Open existing running dev server if already up.
powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}" >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:3000"
  exit /b 0
)

powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}" >nul 2>nul
if not errorlevel 1 (
  start "" "http://localhost:3001"
  exit /b 0
)

echo Starting Ismism Wiki dev server in a new window...
if "%ISMISM_SOURCE_DIR%"=="" (
  start "Ismism Wiki Dev Server" cmd /k "cd /d ""%APP_DIR%"" && npx next dev"
) else (
  start "Ismism Wiki Dev Server" cmd /k "cd /d ""%APP_DIR%"" && set ""ISMISM_SOURCE_DIR=%ISMISM_SOURCE_DIR%"" && npm run dev"
)

set "URL="
for /l %%I in (1,1,45) do (
  powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}" >nul 2>nul
  if not errorlevel 1 (
    set "URL=http://localhost:3000"
    goto :OPEN_BROWSER
  )

  powershell -NoProfile -Command "if((Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue).TcpTestSucceeded){exit 0}else{exit 1}" >nul 2>nul
  if not errorlevel 1 (
    set "URL=http://localhost:3001"
    goto :OPEN_BROWSER
  )

  timeout /t 1 /nobreak >nul
)

echo Server did not become reachable in time.
echo Check the "Ismism Wiki Dev Server" window for errors.
pause
exit /b 1

:OPEN_BROWSER
start "" "!URL!"
exit /b 0
