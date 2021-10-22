FROM node:16-alpine

WORKDIR /app

RUN npm init -y && npm i -D wait-port uvu sqlite3 mysql2 mysql pg pg-promise

CMD [ "node","test" ]