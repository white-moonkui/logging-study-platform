@echo off
REM 测井培训系统 - MongoDB 一键设置脚本
REM 此脚本自动完成 MongoDB 安装、配置和初始化

echo ==================================================
echo   MongoDB 一键设置脚本
echo ==================================================

set "SCRIPT_DIR=%~dp0"
set "DATA_DIR=C:\data\db"

echo [1/5] 检查 Docker...
docker --version >nul 2>&1
if errorlevel 0 (
    echo 发现 Docker，使用 Docker 模式
    set "MODE=docker"
    goto :docker_mode
)

echo [2/5] 检查本地 MongoDB...
"%ProgramFiles%\MongoDB\Server\7.0\bin\mongod.exe" --version >nul 2>&1
if errorlevel 0 (
    echo 发现本地 MongoDB
    set "MODE=local"
    goto :local_mode
)

echo 未检测到 MongoDB，将自动下载安装...
echo.
pause

REM 运行安装脚本
call "%SCRIPT_DIR%install-mongodb.bat"
set "MODE=local"

:local_mode
echo.
echo [3/5] 配置环境变量...
call "%SCRIPT_DIR%set-mongodb-env.bat"

echo.
echo [4/5] 初始化数据库...
cd "%SCRIPT_DIR%.."
npm run init-db
cd "%SCRIPT_DIR%"

echo.
echo [5/5] 运行功能验证...
node "%SCRIPT_DIR%..\test-mongodb.js"

goto :finish

:docker_mode
echo.
echo [3/5] 启动 Docker 容器...
docker-compose -f "%SCRIPT_DIR%..\mongodb-compose.yml" up -d
timeout /t 15 /nobreak >nul

echo.
echo [4/5] 配置环境变量...
call "%SCRIPT_DIR%set-mongodb-env.bat"

echo.
echo [5/5] 初始化数据库...
cd "%SCRIPT_DIR%.."
npm run init-db
cd "%SCRIPT_DIR%"

:finish
echo.
echo ==================================================
echo   🎉 MongoDB 设置完成！
echo ==================================================
echo.
echo 请访问 http://localhost:3000 测试应用
echo.
pause
