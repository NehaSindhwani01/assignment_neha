# Use official Node.js LTS image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the port your server runs on
EXPOSE 5000

# Command to start the server
CMD ["node", "server.js"]
