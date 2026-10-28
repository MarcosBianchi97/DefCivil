FROM node:22-bookworm-slim

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Backend + sitio estático (el backend sirve index.html, admin.html, css/, js/ e img/)
COPY backend ./
COPY index.html admin.html /app/
COPY css /app/css
COPY js /app/js
COPY img /app/img

ENV NODE_ENV=production \
    SITE_DIR=/app \
    PORT=4000
EXPOSE 4000

USER node
CMD ["node", "app.js"]
