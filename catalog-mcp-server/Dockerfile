# catalog-mcp-server/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the MCP server port
EXPOSE 9000

# Start the MCP server
CMD ["npm", "start"]
