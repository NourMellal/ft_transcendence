FROM debian:bookworm

RUN apt update && apt upgrade -y

RUN apt install wget -y 

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh

RUN chmod u+x install.sh

RUN ./install.sh

RUN source "$HOME/.nvm/nvm.sh" && nvm install 22

COPY ./static/profile /static/profile

WORKDIR /app

ARG NPM_MICROSERVICE_SCRIPT
ENV NPM_MICROSERVICE_SCRIPT=${NPM_MICROSERVICE_SCRIPT}

ENTRYPOINT source "$HOME/.nvm/nvm.sh" && npm run $NPM_MICROSERVICE_SCRIPT
