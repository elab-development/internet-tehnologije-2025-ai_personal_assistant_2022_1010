@echo off
REM --- Activate Python virtual environment ---
call "%~dp0\venv\Scripts\activate.bat"

REM --- Optional: set Ollama host (if needed) ---
REM set OLLAMA_HOST=http://localhost:11434

REM --- Start FastAPI backend ---
start "" python "%~dp0\main.py"

REM --- Start Node + React frontend ---
start "" npm run dev

REM --- Keep this window open ---
pause
