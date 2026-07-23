@echo off
REM 测井培训系统 - MongoDB 启动脚本（Windows）

echo ==================================================
echo   测井培训系统 - MongoDB 数据库启动
echo ==================================================

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装，请先安装 Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行，请启动 Docker Desktop
    pause
    exit /b 1
)

echo [1/3] 检查现有容器...
docker ps -a --filter "name=well-logging-mongodb" --format "{{.Names}}" | findstr "well-logging-mongodb" >nul
if %errorlevel% equ 0 (
    echo 发现已有容器，是否删除重建? (y/n)
    set /p confirm=
    if /i "%confirm%"=="y" (
        echo 正在删除旧容器...
        docker rm -f well-logging-mongodb >nul 2>&1
        docker rm -f well-logging-mongo-express >nul 2>&1
    )
)

echo [2/3] 启动 MongoDB 服务...
docker-compose -f mongodb-compose.yml up -d

echo [3/3] 等待服务就绪...
echo 等待 MongoDB 启动（最多30秒）...
timeout /t 10 /nobreak >nul

REM 检查健康状态
for /l %%i in (1,1,6) do (
    docker inspect --format='{{.State.Health.Status}}' well-logging-mongodb 2>nul | findstr "healthy" >nul
    if not errorlevel 1 (
        echo MongoDB 已就绪
        goto :success
    )
    echo 等待中... %%i/6
    timeout /t 5 /nobreak >nul
)

echo [警告] MongoDB 健康检查未通过，但容器可能已启动
goto :success

:success
echo.
echo ==================================================
echo   MongoDB 启动完成！
echo ==================================================
echo.
echo 连接信息:
echo   - MongoDB: localhost:27017
echo   - Web UI:  http://localhost:8081
echo   - 用户名: admin
echo   - 密码:   admin123
echo.
echo 项目配置:
echo   - 修改 .env 文件中的 MONGODB_URI
echo   - 或运行: scripts\set-mongodb-env.bat
echo.
echo 管理命令:
echo   - 停止:    scripts\stop-mongodb.bat
echo   - 查看日志: docker-compose -f mongodb-compose.yml logs -f
echo.
pause
exit /b 0
