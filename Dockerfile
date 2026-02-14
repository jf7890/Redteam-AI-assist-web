# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
WORKDIR /usr/share/nginx/html

# App assets
COPY --from=build /app/dist ./

# Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Runtime env injection (envsubst)
COPY public/env.template.js /usr/share/nginx/html/env.template.js
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
