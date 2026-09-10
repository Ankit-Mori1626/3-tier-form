# Backend Dockerfile
FROM node:20-alpine AS base

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Expose backend port
EXPOSE 5000

# Set non-root user for security best practices
USER node

# Start the application
CMD ["node", "src/server.js"]
