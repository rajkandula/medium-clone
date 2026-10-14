FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Public origin, inlined into the client bundle at build time.
# docker build --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com .
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# --- Production ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

# Runtime configuration (MONGODB_URI, JWT_SECRET, STORAGE_*, ...) comes from the
# environment: docker run --env-file .env -p 8080:8080 blogwrite
CMD ["node", "server.js"]
