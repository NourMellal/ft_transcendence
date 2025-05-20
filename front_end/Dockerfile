FROM node:alpine3.21

WORKDIR /app

COPY ./app/game /static/game

COPY ./app/profile /static/profile

ENTRYPOINT [ "sh", "-c", "(cd ./game && npx tsc) && npm i && npm run dev" ]
