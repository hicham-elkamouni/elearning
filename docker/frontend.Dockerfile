FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV WATCHPACK_POLLING=true
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
