# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build


# -------- Runtime stage --------
FROM node:20-alpine

WORKDIR /app

# Install lightweight static server
RUN npm install -g serve

# Copy built files only
COPY --from=builder /app/dist ./dist

# Expose app port
EXPOSE 5173

# Run static server
CMD ["serve", "-s", "dist", "-l", "5173"]