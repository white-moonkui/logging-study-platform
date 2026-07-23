@echo off
REM 测井培训系统 - MongoDB 停止脚本（Windows）

echo ==================================================
echo   测井培训系统 - MongoDB 数据库停止
echo ==================================================

echo [1/2] 停止容器...
docker-compose -f mongodb-compose.yml down

echo [2/2] 清理数据卷（可选）...
echo 是否删除数据卷? 数据将永久丢失! (y/n)
set /p confirm=
if /i "%confirm%"=="y" (
    echo 正在删除数据卷...
    docker volume rm well_logging_mongo-data 2>nul
    docker volume rm well_logging_mongo-init 2>nul
    echo 数据卷已删除
)

echo.
echo ==================================================
echo   MongoDB 已停止
echo ==================================================
echo.
pause
