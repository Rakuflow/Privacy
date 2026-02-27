FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json & lockfile
COPY package*.json ./

# Cài dependencies 
RUN npm ci

COPY . .

# Expose port Vite
EXPOSE 5001

# Dùng npm run preview cho production
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then npm run preview -- --host 0.0.0.0; else npm run dev -- --host 0.0.0.0; fi"]
