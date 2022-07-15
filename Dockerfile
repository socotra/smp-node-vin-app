FROM node:16-alpine

COPY package.json .

RUN npm install --omit-dev

COPY ./src ./src

Expose 3000

CMD ["node", "src/index.js"]
