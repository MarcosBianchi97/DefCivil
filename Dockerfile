FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend
COPY index.html portal.html ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "backend/app.js"]
