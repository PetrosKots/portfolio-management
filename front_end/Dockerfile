# Stage 1: Build the React app with Vite
FROM node:24-alpine as builder

# Set the working directory inside the container
WORKDIR /front_end

# Copy package.json and package-lock.json (or yarn.lock) to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app files
COPY . .

# Build the production version of the app
RUN npm run build

# Stage 2: Serve the built app with NGINX
FROM nginx:alpine

# Copy the nginx.conf from the correct directory
COPY ../nginx/nginx.conf /etc/nginx/nginx.conf  

# Copy the built files from the builder stage into NGINX's HTML directory
COPY --from=builder /front_end/dist /usr/share/nginx/html

# Expose the port NGINX will serve on
EXPOSE 80

# Run NGINX in the foreground
CMD ["nginx", "-g", "daemon off;"]
