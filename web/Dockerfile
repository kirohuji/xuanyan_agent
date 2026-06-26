# Stage 1: 依赖安装 & 构建
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 环境变量方式全局生效，子进程也会继承
ENV pnpm_config_minimum_release_age=0

# 先复制依赖配置，利用 Docker 缓存
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile 2>&1 || \
    (pnpm approve-builds sharp && pnpm install --frozen-lockfile)

# 再复制源码（不会覆盖已修改的 pnpm-workspace.yaml，因为 approve-builds 修改的是文件内容）
COPY . .

# 确保 pnpm-workspace.yaml 中的配置保留（如果 COPY 覆盖了，重新 approve）
RUN pnpm approve-builds sharp 2>/dev/null; \
    pnpm build

# Stage 2: 运行
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV pnpm_config_minimum_release_age=0

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/.npmrc ./.npmrc
COPY --from=builder /app/pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod 2>&1 || \
    (pnpm approve-builds sharp && pnpm install --frozen-lockfile --prod)

EXPOSE 3000

CMD ["pnpm", "start", "--port", "3000"]
