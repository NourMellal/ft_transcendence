#!/bin/bash

set -e -x
if [ -f /vault_seal.private ]; then exit 0; fi

export VAULT_SKIP_VERIFY=1
vault server -config=/etc/vault.conf&
sleep 2

export VAULT_ADDR=https://127.0.0.1:9955
vault operator init -key-shares=1 -key-threshold=1 > /vault_seal.private
chmod 400 /vault_seal.private
VAULT_UNSEAL_KEY=`cat /vault_seal.private | grep -Po '(?<=(Unseal Key 1: )).+'`
vault operator unseal $VAULT_UNSEAL_KEY
VAULT_UNSEAL_KEY=
VAULT_LOGIN_TOKEN=`cat /vault_seal.private | grep -Po '(?<=(Initial Root Token: )).+'`
vault login $VAULT_UNSEAL_KEY
VAULT_LOGIN_TOKEN=