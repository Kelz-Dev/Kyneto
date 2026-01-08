# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build CSS
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

# Copy built files from build-stage
COPY --from=build-stage /app/index.html /usr/share/nginx/html/
COPY --from=build-stage /app/dist /usr/share/nginx/html/dist

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
