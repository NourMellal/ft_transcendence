FROM debian:bookworm

RUN apt update && apt upgrade -y

RUN apt install wget -y 

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh

RUN chmod u+x install.sh

RUN ./install.sh

RUN source "$HOME/.nvm/nvm.sh" && nvm install 22

RUN mkdir app

WORKDIR /app

COPY ./pong-frontend/package.json .

RUN source "$HOME/.nvm/nvm.sh" && npm install

COPY ./pong-frontend /app

EXPOSE 3000

ENTRYPOINT source "$HOME/.nvm/nvm.sh" && npm run dev
