@echo off
cd /d "%~dp0"
echo Iniciando backend e-Sigma na porta 8000...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
