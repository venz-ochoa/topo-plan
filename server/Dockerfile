#this is for the api container (node)
FROM node:20-alpine

WORKDIR /app

#this is for installing the dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

#this is for copying the rest of the code
COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
