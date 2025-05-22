#!/bin/bash

set -e -x
vault server -config=/etc/vault.conf&
sleep 2
export VAULT_SKIP_VERIFY=1
export VAULT_ADDR=https://127.0.0.1:9955
VAULT_UNSEAL_KEY=`cat /vault/vault_seal.private | grep -Po '(?<=(Unseal Key 1: )).+'`
vault operator unseal $VAULT_UNSEAL_KEY
unset VAULT_UNSEAL_KEY
VAULT_LOGIN_TOKEN=`cat /vault/vault_seal.private | grep -Po '(?<=(Initial Root Token: )).+'`
vault login $VAULT_LOGIN_TOKEN
unset VAULT_LOGIN_TOKEN
vault policy write api_gateway /api_gateway.hcl
vault auth enable userpass
vault write auth/userpass/users/$VAULT_API_GATEWAY_USER password="$VAULT_API_GATEWAY_PASS" policies=api_gateway
# vault write identity/oidc/client/$VAULT_CLIENT_APP_NAME \
#   redirect_uris="$VAULT_OIDC_REDIRECT_URI" \
#   assignments="allow_all"
# vault read identity/oidc/client/$VAULT_CLIENT_APP_NAME > /vault/vault_app_credentials
# chmod 400 /vault/vault_app_credentials
vault secrets enable kv
vault kv put kv/api_gateway GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
vault operator seal
