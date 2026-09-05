FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/incident-hub.db
ENV REQUIRE_PERSISTENT_DATABASE=true

EXPOSE 3000

CMD ["npm", "start"]
