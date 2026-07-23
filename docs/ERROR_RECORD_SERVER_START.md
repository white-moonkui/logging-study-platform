# 服务器启动问题处理记录

**记录时间**: 2026年2月20日
**问题类型**: 开发环境问题 - 服务器无法访问

---

## 问题描述

### 错误信息

```
ERR_CONNECTION_REFUSED
无法访问此页面 localhost 拒绝连接
请检查连接、检查代理和防火墙
```

### 环境信息

- 操作系统: Windows
- Node.js 版本: v25.2.1
- 项目路径: D:\AI-ITEM\logging-study-platform
- 端口: 3000

---

## 错误分析

### 根本原因

1. **端口占用**: 首次启动服务器后，进程未正确终止，导致端口 3000 被占用
2. **启动方式问题**: 使用 `node server.js` 在某些环境下无法保持服务器持续运行
3. **进程残留**: 上一次的 Node 进程 (PID 22664) 仍在后台运行

### 错误日志

```
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle
    at listen
    at app.listen
```

---

## 处理步骤

### 步骤 1: 诊断端口占用

```bash
netstat -ano | findstr :3000
```

**结果**: 发现端口 3000 被 PID 22664 占用

### 步骤 2: 终止占用进程

```bash
taskkill /F /PID 22664
```

**结果**: 进程已终止

### 步骤 3: 使用正确的启动方式

```bash
powershell -Command "Start-Process -FilePath 'node' -ArgumentList 'start.js' -WorkingDirectory 'D:\AI-ITEM\logging-study-platform' -WindowStyle Hidden"
```

或

```bash
cmd /c "node start.js"
```

### 步骤 4: 验证服务器状态

```bash
netstat -ano | findstr :3000
```

**结果**:

```
LocalPort: 3000  State: Listen  ✓
LocalPort: 3000  State: Established  ✓ (浏览器已连接)
```

---

## 解决方案

### 推荐启动方式

#### 方式 1: 使用 start.js (推荐)

```bash
cd D:\AI-ITEM\logging-study-platform
node start.js
```

#### 方式 2: 使用 npm 命令

```bash
cd D:\AI-ITEM\logging-study-platform
npm start
```

#### 方式 3: PowerShell 后台启动

```powershell
powershell -Command "Start-Process -FilePath 'node' -ArgumentList 'start.js' -WorkingDirectory 'D:\AI-ITEM\logging-study-platform' -WindowStyle Hidden"
```

---

## 预防措施

1. **避免端口冲突**: 启动服务器前先检查端口占用

    ```bash
    netstat -ano | findstr :3000
    ```

2. **正确终止服务器**: 使用 Ctrl+C 或关闭终端窗口，不要直接关闭窗口

3. **使用 npm 命令**: 优先使用 `npm start` 而非直接运行 `node server.js`

---

## 相关命令速查

| 操作           | 命令                            |
| -------------- | ------------------------------- |
| 启动服务器     | `npm start` 或 `node start.js`  |
| 检查端口占用   | `netstat -ano \| findstr :3000` |
| 终止占用进程   | `taskkill /F /PID <PID>`        |
| 查看 Node 进程 | `tasklist \| findstr node`      |

---

## 经验总结

1. Windows 环境下使用 `node server.js` 后台保持需要特殊处理
2. `start.js` 提供了更完整的启动流程（数据库初始化、AI服务、向量队列）
3. PowerShell 的 `Start-Process` 可以实现无窗口后台运行
4. 端口占用问题很常见，应该作为常规排查步骤
