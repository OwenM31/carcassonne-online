# @description Production container image for the Carcassonne backend service.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY client/package.json client/package.json
COPY server/package.json server/package.json

RUN npm ci

COPY tsconfig.base.json ./tsconfig.base.json
COPY shared ./shared
COPY server ./server

RUN npm -w @carcassonne/shared run build
RUN npm -w @carcassonne/server run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/server ./server

WORKDIR /app/server
EXPOSE 8080
CMD ["npm", "start"]
