@echo off
REM MoneyTwin AI local launcher. Frontend 5173, backend 8000. Does not touch 3000 or 8766.
setlocal
set ROOT=%~dp0

echo [1/3] Checking backend environment...
if not exist "%ROOT%backend\.venv\Scripts\python.exe" (
  echo     Creating virtual environment and installing requirements
  py -m venv "%ROOT%backend\.venv" || goto :fail
  "%ROOT%backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
  "%ROOT%backend\.venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt" || goto :fail
)

echo [2/3] Starting API on http://localhost:8000 ...
start "MoneyTwin API" cmd /k "cd /d %ROOT%backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [3/3] Starting web app on http://localhost:5173 ...
if not exist "%ROOT%frontend\node_modules" (
  echo     Installing frontend packages
  pushd "%ROOT%frontend" && call npm install || goto :fail
  popd
)
start "MoneyTwin Web" cmd /k "cd /d %ROOT%frontend && npm run dev"

timeout /t 4 >nul
start "" http://localhost:5173
echo.
echo MoneyTwin AI is starting. Two windows stay open; close them to stop.
echo Demo login: click "Explore the demo" on the sign-in screen.
goto :eof

:fail
echo.
echo Setup failed. Read the message above, then check README.md troubleshooting.
pause
