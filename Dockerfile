# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# Stage 2: Final image
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY server/proxy /usr/local/bin/proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh /usr/local/bin/proxy
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
