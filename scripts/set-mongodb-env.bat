@echo off
REM 测井培训系统 - 设置 MongoDB 环境变量

echo ==================================================
echo   设置 MongoDB 连接环境变量
echo ==================================================

REM 检查 .env 文件是否存在
if not exist "%~dp0..\.env" (
    echo [错误] .env 文件不存在
    pause
    exit /b 1
)

echo [1/2] 备份当前 .env 文件...
copy "%~dp0..\.env" "%~dp0..\.env.backup" >nul
echo 已备份到 .env.backup

echo [2/2] 更新 MongoDB URI...
REM 使用 PowerShell 更新 .env 文件
powershell -Command ^
    "(Get-Content '%~dp0..\.env') -replace 'MONGODB_URI=memory://.*', 'MONGODB_URI=mongodb://localhost:27017/well_logging_training' | Set-Content '%~dp0..\.env'"

echo.
echo ==================================================
echo   环境变量已更新!
echo ==================================================
echo.
echo 新的数据库连接: mongodb://localhost:27017/well_logging_training
echo.
echo 下一步:
echo   1. 启动 MongoDB: scripts\start-mongodb.bat
echo   2. 初始化数据库: npm run init-db
echo   3. 启动应用: npm start
echo.
pause
