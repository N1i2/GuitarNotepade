# Используем Node.js 20 (как требуется Next.js 16)
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем package файлы
COPY package.json package-lock.json* ./
COPY yarn.lock* ./

# Сначала обновляем npm и устанавливаем зависимости
RUN npm install -g npm@latest && \
    npm ci --legacy-peer-deps

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Создаем non-root пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Если используете standalone output (рекомендуется для Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Если используете стандартную сборку
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Переключаемся на non-root пользователя
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]