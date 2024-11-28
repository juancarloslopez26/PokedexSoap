FROM node:16-alpine

WORKDIR /app

COPY . /app

RUN npm install

COPY init-mongo.js /docker-entrypoint-initdb.d/init-mongo.js

EXPOSE 3000

CMD ["npm", "start"]