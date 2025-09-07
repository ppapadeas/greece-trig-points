# backend/Dockerfile
FROM node:20

# Install system dependencies for GDAL
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev build-essential

WORKDIR /usr/src/app

# Copy only the package files first
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Now, copy the rest of the application code
COPY . .

# The command to run the app
CMD [ "node", "index.js" ]