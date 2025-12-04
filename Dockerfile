# 多阶段构建：第一阶段为构建环境
FROM node:18-alpine AS builder
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache gcc g++ make python3 sqlite-dev

# 复制所有文件到构建环境
COPY . .

# 安装所有依赖（包括开发依赖）
RUN npm install
RUN cd frontend && npm install && npm run build

# 第二阶段为运行环境，使用更小的镜像
FROM node:18-alpine
WORKDIR /app

# 只安装生产依赖
COPY package*.json ./
RUN npm install --production

# 复制构建产物
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/.env ./

# 暴露端口
EXPOSE 3000

# 绝对路径启动
CMD ["node", "/app/backend/app.js"]