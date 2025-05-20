FROM node:slim

WORKDIR /app

RUN mkdir /static

COPY ./app/game /static/game

ENTRYPOINT [ "npm", "run", "dev" ]
