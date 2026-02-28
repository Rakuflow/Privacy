@echo off

echo Starting Relayer Service...
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo No .env file found!
    echo.
    echo For DEMO/TESTING ^(relayer won't actually work but UI will show toggle^):
    echo   copy .env.demo .env
    echo.
    echo For PRODUCTION ^(with real wallet^):
    echo   copy .env.example .env
    echo   REM Then edit .env with relayer wallet credentials
    echo.
    set /p answer="Use DEMO mode? (y/n): "
    if /i "%answer%"=="y" (
        copy .env.demo .env
        echo Created .env from .env.demo
    ) else (
        copy .env.example .env
        echo Created .env from .env.example
        echo Please edit .env with wallet credentials before continuing
        exit /b 1
    )
)

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Start server
echo.
echo Starting relayer service...
echo ================================
call npm run dev
