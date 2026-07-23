# 测井培训 AI 服务 - Docker 配置
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（PDF解析等需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-chi-sim \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 8001

# 环境变量
ENV HOST=0.0.0.0
ENV PORT=8001
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["python", "main.py"]
