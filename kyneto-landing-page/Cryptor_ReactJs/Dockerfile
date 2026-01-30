# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build React app with memory optimizations
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV PUBLIC_URL=/
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

# Copy built files from build-stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set permissions and ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    echo "<h1>Debug: Nginx is serving files</h1>" > /usr/share/nginx/html/debug.html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
