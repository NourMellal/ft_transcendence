FROM debian:bookworm

RUN apt update && apt install openssl -y

COPY ./tools/san.cnf /san.cnf
RUN openssl ecparam -name prime256v1 -genkey -out /etc/vault_cert.key
RUN openssl req -x509 -key /etc/vault_cert.key -out /etc/vault_cert.pem -sha256 -days 3650 -noenc -config /san.cnf

COPY ./tools/api_gateway.hcl /api_gateway.hcl
COPY ./conf/vault.conf /etc/vault.conf
COPY ./tools/install.sh /install.sh
RUN chmod u+x /install.sh && /install.sh

COPY ./tools/configure.sh /configure.sh

ARG GOOGLE_CLIENT_ID
ENV $GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ARG GOOGLE_CLIENT_SECRET
ENV $GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ARG VAULT_API_GATEWAY_USER
ENV $VAULT_API_GATEWAY_USER=${VAULT_API_GATEWAY_USER}
ARG VAULT_API_GATEWAY_PASS
ENV $VAULT_API_GATEWAY_PASS=${VAULT_API_GATEWAY_PASS}
RUN chmod u+x /configure.sh && /configure.sh

EXPOSE 9955

CMD [ "server", "-config=/etc/vault.conf" ]

ENTRYPOINT [ "vault" ]