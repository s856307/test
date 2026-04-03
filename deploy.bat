@echo off

echo ============================
echo   GitHub Pages Deploy Tool
echo ============================

REM ===== 設定你的 repo URL =====
set REPO_URL=https://github.com/s856307/test.git

echo.
echo [0/4] Check Git Init...
if not exist ".git" (
    echo Initializing git repository...
    git init
)

echo.
echo [1/4] Set Remote Origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo [2/4] Git Add...
git add .

REM 檢查是否有變更
git diff --cached --quiet
IF %ERRORLEVEL% EQU 0 (
    echo ⚠️ No changes to commit
    pause
    exit /b
)

echo.
echo [3/4] Git Commit...
set msg=update %date% %time%
git commit -m "%msg%"

echo.
echo [4/4] Git Push...
git branch -M main
git push -u origin main

echo.
echo ✅ Deploy Complete!
pause