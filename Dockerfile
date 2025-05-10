FROM node:23-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN yarn install
COPY .env.example ./
COPY *.sql ./
COPY *.js ./
COPY ./utils ./utils
COPY ./socket ./socket
CMD ["node", "index.js"]