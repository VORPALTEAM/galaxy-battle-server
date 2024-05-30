FROM node:20.11.1-alpine3.19 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install typescript -g

COPY . .

RUN tsc && ls

FROM node:20.11.1-alpine3.19 as server

WORKDIR /app

COPY --from=builder /app/build /app
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 3089

CMD node index.js