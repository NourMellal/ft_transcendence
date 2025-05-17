#!/bin/bash

set -e -x
mkdir /vault
export VAULT_SKIP_VERIFY=1
vault server -config=/etc/vault.conf&
sleep 2
export VAULT_ADDR=https://127.0.0.1:9955
if [ ! -f /vault/vault_seal.private ]; then
    vault operator init -key-shares=1 -key-threshold=1 > /vault/vault_seal.private
    chmod 400 /vault/vault_seal.private
fi
VAULT_UNSEAL_KEY=`cat /vault/vault_seal.private | grep -Po '(?<=(Unseal Key 1: )).+'`
vault operator unseal $VAULT_UNSEAL_KEY
unset VAULT_UNSEAL_KEY
VAULT_LOGIN_TOKEN=`cat /vault/vault_seal.private | grep -Po '(?<=(Initial Root Token: )).+'`
vault login $VAULT_LOGIN_TOKEN
vault auth enable userpass
unset VAULT_LOGIN_TOKEN
vault write identity/oidc/client/$VAULT_CLIENT_APP_NAME \
  redirect_uris="$VAULT_OIDC_REDIRECT_URI" \
  assignments="allow_all"
vault read identity/oidc/client/$VAULT_CLIENT_APP_NAME > /vault/vault_app_credentials
chmod 400 /vault/vault_app_credentials
vault operator seal