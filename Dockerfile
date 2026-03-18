FROM node:20-alpine AS client-build

WORKDIR /build
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY backend/src ./src
COPY public ./public
COPY --from=client-build /build/dist ./public-client

EXPOSE 3000

CMD ["node", "src/app.js"]
