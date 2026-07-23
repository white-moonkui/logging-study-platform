#!/bin/bash
# 测井培训系统 - MongoDB 安装脚本 (Ubuntu/Debian)

echo "=================================================="
echo "  MongoDB 安装脚本 (Ubuntu/Debian)"
echo "=================================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

echo "[1/5] 添加 MongoDB GPG 密钥..."
wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

echo "[2/5] 添加 MongoDB 仓库..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-8.0.list

echo "[3/5] 安装 MongoDB..."
apt-get update
apt-get install -y mongodb-org

echo "[4/5] 启动 MongoDB 服务..."
systemctl enable mongod
systemctl start mongod
systemctl status mongod

echo "[5/5] 验证安装..."
mongosh --eval "db.version()"

echo ""
echo "=================================================="
echo "  MongoDB 安装完成!"
echo "=================================================="
echo ""
echo "下一步操作:"
echo "  1. 配置项目使用 MongoDB:"
echo "     scripts/set-mongodb-env.sh"
echo ""
echo "  2. 初始化数据库:"
echo "     npm run init-db"
echo ""
echo "  3. 启动应用:"
echo "     npm start"
echo ""
