# Docker file to install mongodb and run the server
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy over all the files
COPY . .

# Install app dependencies
RUN npm install

# Run the server
CMD [ "npm", "start" ]