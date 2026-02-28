FROM node:20-alpine AS base

WORKDIR /usr/src/app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 3001
CMD ["npm", "start"]