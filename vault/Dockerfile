FROM debian:bookworm

COPY ./tools/install.sh /install.sh

RUN chmod u+x /install.sh && /install.sh

COPY ./conf/vault.conf /etc/vault.conf

EXPOSE 9955

CMD [ "server", "-config=/etc/vault.conf" ]

ENTRYPOINT [ "vault" ]