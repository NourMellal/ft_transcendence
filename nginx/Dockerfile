FROM debian:bookworm

RUN apt update && apt upgrade -y && apt install nginx -y

RUN apt install openssl -y

WORKDIR /usr/local/nginx/conf

RUN openssl req -x509 -newkey rsa:4096 -keyout cert.key -out cert.pem -sha256 -days 3650 -noenc -subj "/C=MA/ST=BENGURIR/L=BENGURIR/SN=msitni"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf 

COPY ./conf/default.conf /etc/nginx/sites-enabled/default

EXPOSE 443

ENTRYPOINT [ "nginx" ]