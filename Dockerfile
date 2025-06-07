# Use Node 20 Alpine for small image size
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy all other files
COPY . .

# Default command: run the dev bot
CMD ["npm", "run", "dev"]
