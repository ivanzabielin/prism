@echo off
REM Launch PRISM in your browser via a local HTTP server (needed only if you
REM prefer http:// over file:// — file:// also works since we use classic scripts).
setlocal
cd /d "%~dp0"
where python >nul 2>&1
if errorlevel 1 (
  echo Python not found. Just double-click index.html — it works on file:// too.
  start "" "index.html"
  goto :eof
)
start "" "http://localhost:8765/index.html"
python -m http.server 8765