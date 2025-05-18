FROM debian:bookworm

RUN apt update && apt install openssl -y

COPY ./tools/install.sh /install.sh
RUN chmod u+x /install.sh && /install.sh


COPY ./tools/san.cnf /san.cnf
RUN openssl ecparam -name prime256v1 -genkey -out /etc/vault_cert.key
RUN openssl req -x509 -key /etc/vault_cert.key -out /etc/vault_cert.pem -sha256 -days 3650 -noenc -config /san.cnf


COPY ./conf/vault.conf /etc/vault.conf
COPY ./tools/configure.sh /configure.sh

ARG VAULT_CLIENT_APP_NAME
ENV $VAULT_CLIENT_APP_NAME=${VAULT_CLIENT_APP_NAME}
ARG VAULT_OIDC_REDIRECT_URI
ENV $VAULT_OIDC_REDIRECT_URI=${VAULT_OIDC_REDIRECT_URI}
RUN chmod u+x /configure.sh && /configure.sh


EXPOSE 9955

CMD [ "server", "-config=/etc/vault.conf" ]

ENTRYPOINT [ "vault" ]