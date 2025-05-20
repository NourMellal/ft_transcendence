FROM node:slim

WORKDIR /app

RUN mkdir /static

COPY ./app/game /static/game

COPY ./app/profile /static/profile

ENTRYPOINT [ "npm", "run", "dev" ]
