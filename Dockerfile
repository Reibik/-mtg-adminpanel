FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY backend/src ./src
COPY public ./public

EXPOSE 3000

CMD ["node", "src/app.js"]
