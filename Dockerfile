FROM node:20.11.1-alpine3.19 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install typescript -g

COPY . .

RUN tsc && ls

FROM node:20.11.1-alpine3.19 as server

ARG WS_PORT
ARG HTTP_PORT

WORKDIR /app

COPY --from=builder /app /app
#COPY --from=builder /app/node_modules /app/node_modules

EXPOSE ${WS_PORT}
EXPOSE ${HTTP_PORT}

CMD node build/index.js