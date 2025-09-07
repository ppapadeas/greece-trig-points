FROM node:20

# Install system dependencies for GDAL
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential

# Set the working directory
WORKDIR /usr/src/app

# Copy ONLY the backend's package files
COPY backend/package*.json ./

# Install npm dependencies
RUN npm install

# Copy the REST of the backend's source code
COPY backend/. ./

# The command to run the app in production
CMD [ "node", "index.js" ]