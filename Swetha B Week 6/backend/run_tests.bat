@echo off
REM Run backend tests using the virtual environment
cd /d "%~dp0"
call venv\Scripts\activate
python -m pytest
pause
