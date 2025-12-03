# 极简版Dockerfile
FROM node:18-alpine
WORKDIR /app

# 复制所有文件
COPY . .

# 安装依赖
RUN npm install && cd frontend && npm install && npm run build

# 暴露端口
EXPOSE 3000

# 绝对路径启动
CMD ["node", "/app/backend/app.js"]