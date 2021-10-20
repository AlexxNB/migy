FROM node:16-alpine

COPY dist /app/dist
COPY test /app/test

WORKDIR /app

RUN npm init -y \
 && npm i -D sqlite3 uvu

CMD [ "node", "test" ]