FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for both tiers
RUN npm --prefix backend install --production=false
RUN npm --prefix frontend install

# Copy application source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build React production bundle
RUN npm --prefix frontend run build

# Ensure uploads folder exists
RUN mkdir -p /app/backend/uploads

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "backend/server.js"]
