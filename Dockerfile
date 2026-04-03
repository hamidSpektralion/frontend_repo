# ── Spektralion Frontend ──────────────────────────────────────────────────────
# Stage 1: build the React app
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent

COPY . .
# In production, the frontend calls /api/* (same origin via nginx proxy)
ENV VITE_API_BASE_URL=""
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
