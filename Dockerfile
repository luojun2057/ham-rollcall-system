# 多阶段构建
FROM node:18-alpine AS build
WORKDIR /app

# 复制根目录的package.json和package-lock.json
COPY package*.json ./

# 安装根目录依赖（后端依赖）
RUN npm install

# 复制前端代码和package.json
COPY frontend/ ./frontend

# 安装前端依赖
WORKDIR /app/frontend
RUN npm install

# 构建前端
RUN npm run build

# 生产阶段
FROM node:18-alpine
WORKDIR /app

# 安装PM2用于管理进程
RUN npm install -g pm2

# 复制根目录的package.json和node_modules
COPY package*.json ./
COPY .env ./
COPY --from=build /app/node_modules ./node_modules

# 复制后端代码
COPY backend/ ./backend

# 复制前端构建产物
COPY --from=build /app/frontend/dist ./frontend/dist

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pm2-runtime", "backend/app.js"]