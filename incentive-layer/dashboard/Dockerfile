FROM nginx:alpine

# Copy dashboard files to the default nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
