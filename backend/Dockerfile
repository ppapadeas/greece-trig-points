# --- Base Stage ---
FROM node:20 as base
# Set the working directory for all subsequent commands
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential
# Copy the package files from the 'backend' folder in our git repo
COPY backend/package*.json ./

# --- Development Stage ---
FROM base as development
RUN npm install
COPY backend/. ./
CMD [ "npm", "run", "dev" ]

# --- Production Stage ---
FROM base as production
RUN npm install --omit=dev
COPY backend/. ./
CMD [ "node", "index.js" ]