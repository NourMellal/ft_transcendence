FROM debian:bookworm

RUN apt update && apt upgrade -y

COPY ./tools/install.sh .

RUN chmod u+x install.sh && ./install.sh

COPY ./conf/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

EXPOSE 5577

ENTRYPOINT [ "rabbitmq-server" ]