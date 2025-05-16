FROM debian:bookworm

RUN apt update && apt install openssl -y

RUN apt install wget -y 

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh

RUN chmod u+x install.sh

RUN ./install.sh

RUN source "$HOME/.nvm/nvm.sh" && nvm install 22

COPY ./san.cnf /san.cnf
RUN openssl ecparam -name secp521r1 -genkey -out /private.key
RUN openssl req -x509 -key /private.key -out /cert.pem -sha256 -days 3650 -noenc -config /san.cnf

WORKDIR /app

EXPOSE 5566

ARG NPM_MICROSERVICE_SCRIPT
ENV NPM_MICROSERVICE_SCRIPT=${NPM_MICROSERVICE_SCRIPT}

ENTRYPOINT source "$HOME/.nvm/nvm.sh" && npm run $NPM_MICROSERVICE_SCRIPT
