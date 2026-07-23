# MongoDB 部署指南

## 目录

- [快速开始](#快速开始)
- [Docker 部署](#docker-部署)
- [本地安装](#本地安装)
- [配置项目](#配置项目)
- [验证测试](#验证测试)
- [故障排除](#故障排除)
- [备份恢复](#备份恢复)

---

## 快速开始

### Windows（推荐 Docker）

```bash
# 1. 启动 MongoDB
scripts\start-mongodb.bat

# 2. 设置环境变量
scripts\set-mongodb-env.bat

# 3. 初始化数据库
npm run init-db

# 4. 启动应用
npm start
```

### Docker Compose

```bash
# 启动 MongoDB
docker-compose -f mongodb-compose.yml up -d

# 停止
docker-compose -f mongodb-compose.yml down
```

---

## Docker 部署

### 前置要求

- Docker Desktop for Windows/Mac
- 或 Docker Engine for Linux

### 启动步骤

#### 方式一：使用启动脚本（Windows）

```bash
# 启动 MongoDB 和 Web UI
scripts\start-mongodb.bat

# 停止
scripts\stop-mongodb.bat
```

#### 方式二：直接使用 Docker Compose

```bash
# 前台运行（查看日志）
docker-compose -f mongodb-compose.yml up

# 后台运行
docker-compose -f mongodb-compose.yml up -d

# 查看日志
docker-compose -f mongodb-compose.yml logs -f

# 停止服务
docker-compose -f mongodb-compose.yml down
```

### 访问地址

| 服务    | 地址                    | 说明               |
| ------- | ----------------------- | ------------------ |
| MongoDB | `localhost:27017`       | 数据库连接         |
| Web UI  | `http://localhost:8081` | MongoDB 可视化管理 |
| 用户名  | `admin`                 | Web UI 登录        |
| 密码    | `admin123`              | Web UI 密码        |

---

## 本地安装

### Windows

1. 下载 MongoDB Community Server

    ```
    https://www.mongodb.com/try/download/community
    ```

2. 安装步骤：
    - 运行安装程序
    - 选择 "Complete" 安装
    - 勾选 "Install MongoDB as a Service"
    - 设置数据目录（如 `C:\data\db`）
    - 完成安装

3. 启动服务：

    ```bash
    # 命令行启动
    mongod --dbpath C:\data\db

    # 或使用服务
    net start MongoDB
    ```

### macOS

```bash
# 使用 Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0

# 启动服务
brew services start mongodb-community@7.0

# 停止服务
brew services stop mongodb-community@7.0
```

### Linux (Ubuntu)

```bash
# 导入公钥
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 添加仓库
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 安装
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl status mongod
```

---

## 配置项目

### 修改 .env 文件

```bash
# 从内存数据库切换到 MongoDB
# 编辑 .env 文件，修改:
MONGODB_URI=mongodb://localhost:27017/well_logging_training
```

### 使用脚本自动配置（Windows）

```bash
scripts\set-mongodb-env.bat
```

### 连接字符串格式

| 类型        | 格式                                                                                 |
| ----------- | ------------------------------------------------------------------------------------ |
| 本地        | `mongodb://localhost:27017/well_logging_training`                                    |
| 带认证      | `mongodb://user:password@localhost:27017/well_logging_training?authSource=admin`     |
| 远程        | `mongodb://192.168.1.100:27017/well_logging_training`                                |
| Replica Set | `mongodb://host1:27017,host2:27017,host3:27017/well_logging_training?replicaSet=rs0` |

---

## 验证测试

### 方式一：运行验证脚本

```bash
# 设置测试环境变量（如果应用不在默认端口）
set TEST_BASE_URL=http://localhost:3000

# 运行验证
node test-mongodb.js
```

### 方式二：手动验证

1. 启动 MongoDB 后，访问 Web UI

    ```
    http://localhost:8081
    ```

2. 检查数据库是否创建：
    - 数据库: `well_logging_training`
    - 集合: `users`, `knowledge`, `cases`, `exams`

3. 启动应用并测试：
    ```bash
    npm start
    # 访问 http://localhost:3000
    # 登录 admin/admin123
    # 检查知识搜索、案例列表等功能
    ```

### 功能检查清单

- [ ] 用户登录（测试 $or 查询）
- [ ] 知识搜索（测试 $regex）
- [ ] 案例关联查询（测试 populate）
- [ ] 考试列表（测试 $in 查询）
- [ ] 数据持久化（重启后数据仍在）

---

## 故障排除

### MongoDB 连接失败

```bash
# 1. 检查 MongoDB 是否运行
docker ps | grep mongo
# 或
ps aux | grep mongod

# 2. 检查端口是否正确
netstat -an | findstr 27017

# 3. 查看 MongoDB 日志
docker logs well-logging-mongodb
# 或
tail -f /var/log/mongodb/mongod.log
```

### 认证错误

```bash
# 检查连接字符串格式
# 正确的格式（带 authSource）：
mongodb://admin:password123@localhost:27017/well_logging_training?authSource=admin
```

### 数据为空

```bash
# 重新初始化数据库
npm run init-db

# 或手动插入测试数据
mongosh well_logging_training --eval "
db.users.insertMany([
  { username: 'admin', email: 'admin@test.com', password: 'xxx', role: 'admin' },
  { username: 'instructor', email: 'instructor@test.com', password: 'xxx', role: 'instructor' },
  { username: 'student', email: 'student@test.com', password: 'xxx', role: 'student' }
]);
"
```

### 内存数据库模式未切换

```bash
# 1. 检查 .env 配置
type .env | findstr MONGODB_URI

# 2. 确保内存数据库配置已注释
# MONGODB_URI=memory://well_logging_training  ← 这个应该注释掉

# 3. 重新运行配置脚本
scripts\set-mongodb-env.bat
```

---

## 备份恢复

### Docker 备份

```bash
# 备份数据库
docker exec well-logging-mongodb mongodump \
    --db well_logging_training \
    --out /data/backup/$(date +%Y%m%d)

# 复制备份到本地
docker cp well-logging-mongodb:/data/backup/ ./backup/

# 恢复数据库
docker cp ./backup/ well-logging-mongodb:/data/restore/
docker exec well-logging-mongodb mongorestore \
    --db well_logging_training \
    /data/restore/well_logging_training
```

### 自动备份（Windows 任务计划程序）

创建 `scripts\backup-mongodb.bat`：

```batch
@echo off
set BACKUP_DIR=D:\backup\mongodb
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%

docker exec well-logging-mongodb mongodump ^
    --db well_logging_training ^
    --out /data/backup/%DATE%

docker cp well-logging-mongodb:/data/backup/%DATE% %BACKUP_DIR%\%DATE%

echo 备份完成: %BACKUP_DIR%\%DATE%
```

### MongoDB Atlas 备份（云托管）

1. 注册 MongoDB Atlas

    ```
    https://cloud.mongodb.com
    ```

2. 创建免费集群

3. 配置备份（自动每日备份）

4. 获取连接字符串并更新 `.env`

---

## 从内存数据库迁移

如果之前使用内存数据库，需要：

1. **备份数据**（如有需要）
2. **切换配置**（见配置项目）
3. **重新初始化**
    ```bash
    npm run init-db
    ```

注意：切换到 MongoDB 后，内存数据库中的数据不会自动迁移，需要重新初始化。

---

## 生产环境建议

### 安全配置

```yaml
# docker-compose.yml 添加认证
mongodb:
    image: mongo:7.0
    environment:
        - MONGO_INITDB_ROOT_USERNAME=admin
        - MONGO_INITDB_ROOT_PASSWORD=your_secure_password
    command: [--auth]
```

### 性能优化

```javascript
// 在模型中添加索引
knowledgeSchema.index({ title: 'text', content: 'text' });
knowledgeSchema.index({ category: 1, status: 1 });
knowledgeSchema.index({ createdAt: -1 });
```

### 监控

```bash
# 查看实时指标
docker exec -it well-logging-mongodb mongosh --eval "db.serverStatus()"
```

---

## 联系与支持

如有问题，请检查：

1. 故障排除章节
2. GitHub Issues
3. 项目文档
