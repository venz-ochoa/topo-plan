#this is for stage 1: building the react app
FROM node:20-alpine AS build

WORKDIR /app

#this is for installing the dependencies
COPY package*.json ./
RUN npm install

#this is for copying the code and building it
COPY . .
RUN npm run build

#this is for stage 2: serving the built app with nginx
FROM nginx:alpine

#this is for the nginx config (serves the app and proxies /api to express)
COPY nginx.conf /etc/nginx/conf.d/default.conf

#this is for copying the build output into nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
