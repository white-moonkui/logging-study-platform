@echo off
REM 测井培训系统 - MongoDB 本地安装脚本（Windows）
REM 此脚本帮助下载和安装 MongoDB Community Server

echo ==================================================
echo   MongoDB 本地安装脚本
echo ==================================================

set "MONGODB_VERSION=7.0.14"
set "MONGODB_DOWNLOAD_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14-signed.msi"
set "INSTALL_DIR=C:\Program Files\MongoDB\Server\7.0"
set "DATA_DIR=C:\data\db"

echo [1/4] 检查系统架构...
wmic os get osarchitecture | findstr "64-bit" >nul
if errorlevel 1 (
    echo [错误] 仅支持 64 位 Windows 系统
    pause
    exit /b 1
)

echo [2/4] 检查是否已安装...
if exist "%INSTALL_DIR%\bin\mongod.exe" (
    echo MongoDB 已安装在 %INSTALL_DIR%
    echo [跳过] 安装步骤
    goto :setup
)

echo [3/4] 下载 MongoDB（可能需要几分钟）...
echo 下载地址: %MONGODB_DOWNLOAD_URL%
echo.

set "MSI_FILE=%TEMP%\mongodb-windows-x86_64-7.0.14-signed.msi"

REM 检查是否已下载
if exist "%MSI_FILE%" (
    echo 发现已下载的安装文件
) else (
    echo 正在下载，请稍候...
    powershell -Command "& {Invoke-WebRequest -Uri '%MONGODB_DOWNLOAD_URL%' -OutFile '%MSI_FILE%'}"
    if errorlevel 1 (
        echo [错误] 下载失败，请手动下载:
        echo %MONGODB_DOWNLOAD_URL%
        pause
        exit /b 1
    )
)

echo [4/4] 安装 MongoDB...
echo 请在弹出的安装向导中:
echo   1. 点击 "Next"
echo   2. 勾选 "I accept the agreement"，点击 "Next"
echo   3. 选择 "Complete"，点击 "Next"
echo   4. 选择 "Run service as Network Service user"，点击 "Next"
echo   5. 确保勾选 "Install MongoD as a Service"，点击 "Next"
echo   6. 点击 "Install" 开始安装
echo   7. 安装完成后点击 "Finish"
echo.
pause

msiexec /i "%MSI_FILE%" /passive

echo 等待安装完成（30秒）...
timeout /t 30 /nobreak >nul

if not exist "%INSTALL_DIR%\bin\mongod.exe" (
    echo [警告] 安装可能未完成，请手动检查
) else (
    echo ✅ MongoDB 安装完成
)

:setup
echo.
echo ==================================================
echo   MongoDB 服务配置
echo ==================================================

REM 创建数据目录
if not exist "%DATA_DIR%" (
    echo 创建数据目录: %DATA_DIR%
    mkdir "%DATA_DIR%"
)

REM 检查服务状态
echo 检查 MongoDB 服务状态...
net start | findstr "MongoDB" >nul
if errorlevel 1 (
    echo 正在启动 MongoDB 服务...
    net start MongoDB
) else (
    echo ✅ MongoDB 服务已在运行
)

echo.
echo ==================================================
echo   安装完成！
echo ==================================================
echo.
echo 连接地址: localhost:27017
echo 数据目录: %DATA_DIR%
echo.
echo 下一步操作:
echo   1. 配置项目使用 MongoDB:
echo      scripts\set-mongodb-env.bat
echo.
echo   2. 初始化数据库:
echo      npm run init-db
echo.
echo   3. 启动应用:
echo      npm start
echo.
echo 或运行一键迁移:
echo   scripts\mongodb-oneclick-setup.bat
echo.
pause
