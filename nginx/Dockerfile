FROM debian:bookworm

RUN apt update && apt install nginx openssl -y

COPY ./tools/ModSecurity.sh /ModSecurity.sh

RUN chmod u+x /ModSecurity.sh && ./ModSecurity.sh 

COPY ./conf/modsec.conf /etc/nginx/modsec/modsec.conf 

WORKDIR /usr/local/nginx/conf

COPY ./tools/san.cnf /san.cnf
RUN openssl ecparam -name prime256v1 -genkey -out cert.key
RUN openssl req -x509 -key cert.key -out cert.pem -sha256 -days 3650 -noenc -config /san.cnf

COPY ./conf/nginx.conf /etc/nginx/nginx.conf 

COPY ./conf/default.conf /etc/nginx/sites-enabled/default

COPY ./conf/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf /usr/local/modsecurity-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf

COPY ./conf/crs-setup.conf /usr/local/modsecurity-crs/crs-setup.conf

EXPOSE 443

ENTRYPOINT [ "nginx" ]