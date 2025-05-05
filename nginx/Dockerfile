FROM debian:bookworm

RUN apt update && apt upgrade -y 

RUN apt install nginx openssl -y

#Installing modSecurity library:
RUN apt install git automake libyajl-dev libgeoip-dev libmaxminddb-dev liblmdb++-dev liblua5.4-dev libpcre2-dev

RUN git clone --recursive https://github.com/owasp-modsecurity/ModSecurity ModSecurity

WORKDIR /ModSecurity

RUN ./build.sh && ./configure && make && make install



WORKDIR /usr/local/nginx/conf

RUN openssl req -x509 -newkey rsa:4096 -keyout cert.key -out cert.pem -sha256 -days 3650 -noenc -subj "/C=MA/ST=BENGURIR/L=BENGURIR/SN=msitni"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf 

COPY ./conf/default.conf /etc/nginx/sites-enabled/default

EXPOSE 443

ENTRYPOINT [ "nginx" ]