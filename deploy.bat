@echo off
echo ============================
echo   GitHub Pages Auto Deploy
echo ============================

REM ===== 設定你的 repo URL =====
set REPO_URL=https://github.com/s856307/test.git

REM ===== 初始化 git（如果還沒 init）=====
if not exist ".git" (
    echo Initializing git repository...
    git init
)

REM ===== 設定 remote（每次保證正確）=====
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

REM ===== 拉取遠端（避免 fast-forward 問題）=====
echo Pull remote changes...
git fetch origin main >nul 2>&1

REM ===== 嘗試 merge，遇衝突自動保留本地 =====
git merge -X ours origin/main --allow-unrelated-histories -m "Merge remote, keep local version" >nul 2>&1

REM ===== Add & Commit =====
git add .

REM 檢查是否有變更
git diff --cached --quiet
IF %ERRORLEVEL% EQU 0 (
    echo ⚠️ No changes to commit
    pause
    exit /b
)

REM Commit with timestamp
set msg=update %date% %time%
git commit -m "%msg%"

REM ===== Push =====
git branch -M main
git push origin main

echo.
echo ✅ Deploy Complete!
pause