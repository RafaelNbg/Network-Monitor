
@echo off
title Network Monitor - API

cd /d "%~dp0"

python -m uvicorn api:app --reload

pause
