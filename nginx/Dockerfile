FROM debian:bookworm

RUN apt update && apt upgrade -y 

RUN apt install nginx openssl -y

COPY ./tools/ModSecurity.sh /ModSecurity.sh

RUN chmod u+x /ModSecurity.sh && ./ModSecurity.sh 

COPY ./conf/modsec.conf /etc/nginx/modsec/modsec.conf 

WORKDIR /usr/local/nginx/conf

RUN openssl req -x509 -newkey rsa:4096 -keyout cert.key -out cert.pem -sha256 -days 3650 -noenc -subj "/C=MA/ST=BENGURIR/L=BENGURIR/SN=msitni"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf 

COPY ./conf/default.conf /etc/nginx/sites-enabled/default

COPY ./conf/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf /usr/local/modsecurity-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf

COPY ./conf/crs-setup.conf /usr/local/modsecurity-crs/crs-setup.conf

EXPOSE 443

ENTRYPOINT [ "nginx" ]