# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# SQL migrations are read at startup by dist/scripts/migrate.js
COPY --from=build /app/drizzle ./drizzle
EXPOSE 5001
CMD ["node", "dist/index.js"]
