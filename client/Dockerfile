# @description Production container image for the Carcassonne frontend service.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY client/package.json client/package.json
COPY server/package.json server/package.json

RUN npm ci

COPY tsconfig.base.json ./tsconfig.base.json
COPY shared ./shared
COPY client ./client

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN npm -w @carcassonne/shared run build
RUN npm -w @carcassonne/client run build

FROM nginx:1.27-alpine AS runtime
COPY infra/nginx/client.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
