# --- Base Stage ---
FROM node:20 as base
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential
COPY package*.json ./

# --- Development Stage ---
FROM base as development
RUN npm install
COPY . .
CMD [ "npm", "run", "dev" ]

# --- Production Stage ---
FROM base as production
RUN npm install --omit=dev
COPY . .
CMD [ "node", "index.js" ]