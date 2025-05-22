#!/bin/bash

set -e -x
apt update && apt install wget gpg lsb-release -y
wget -O - https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list
apt update && apt install vault -y

mkdir /vault
vault server -config=/etc/vault.conf&
sleep 2
export VAULT_SKIP_VERIFY=1
export VAULT_ADDR=https://127.0.0.1:9955
if [ ! -f /vault/vault_seal.private ]; then
    vault operator init -key-shares=1 -key-threshold=1 > /vault/vault_seal.private
    chmod 400 /vault/vault_seal.private
fi