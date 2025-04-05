FROM debian:bookworm

RUN apt update && apt upgrade -y

COPY ./tools/install.sh .

RUN chmod u+x install.sh && ./install.sh

COPY ./conf/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

COPY ./tools/run.sh .

RUN chmod u+x run.sh

EXPOSE 5577

ENTRYPOINT [ "./run.sh" ]
