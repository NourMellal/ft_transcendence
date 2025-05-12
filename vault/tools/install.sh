#!/bin/bash

set -e -x
apt update && apt install wget gpg lsb-release -y
wget -O - https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list
apt update && apt install openssl vault -y
openssl req -x509 -newkey rsa:4096 -keyout /etc/vault_cert.key -out /etc/vault_cert.pem -sha256 -days 3650 -noenc -subj "/C=MA/ST=BENGURIR/L=BENGURIR/SN=msitni"