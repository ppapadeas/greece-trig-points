# ===================================================================
# FINAL UNIFIED DOCKERFILE
# ===================================================================

# --- Base Stage ---
# Installs dependencies common to both dev and prod
FROM node:20 as base
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential
COPY backend/package*.json ./

# --- Development Stage ---
# Used ONLY for local development via Docker Compose
FROM base as development
# Install ALL dependencies, including devDependencies like nodemon
RUN npm install
COPY backend/. ./
CMD [ "npm", "run", "dev" ]

# --- Production Stage ---
# This is the final, lean stage that Koyeb will build
FROM base as production
# Install ONLY production dependencies
RUN npm install --omit=dev
COPY backend/. ./
CMD [ "node", "index.js" ]
