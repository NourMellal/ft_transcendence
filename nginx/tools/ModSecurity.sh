#!/bin/sh

set -e -x
NGINX_VERSION=`nginx -v 2>&1 | grep -Po '(?<=nginx/)(\d|\.)+'`
NGINX_CONFIGURE_ARGS=`nginx -V 2>&1 | grep -Po '(?<=configure arguments: )(.)+'`
# Compiling LibModSecurity:
apt install wget git build-essential automake libyajl-dev libgeoip-dev libmaxminddb-dev liblmdb++-dev liblua5.4-dev libpcre2-dev libssl-dev zlib1g-dev libxslt1-dev libgd-dev libperl-dev -y
git clone --recursive https://github.com/owasp-modsecurity/ModSecurity ModSecurity
cd /ModSecurity
./build.sh && ./configure && make && make install
mkdir /etc/nginx/modsec
cp /ModSecurity/unicode.mapping /etc/nginx/modsec/
cat /ModSecurity/modsecurity.conf-recommended | sed 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' > /etc/nginx/modsec/modsecurity.conf
rm -rf /ModSecurity
# Compiling ModSecurity-Nginx-connector using third-party module procedure:
cd /
wget https://nginx.org/download/nginx-$NGINX_VERSION.tar.gz
git clone https://github.com/owasp-modsecurity/ModSecurity-nginx.git ModSecurity-nginx
tar xf nginx-$NGINX_VERSION.tar.gz
cd nginx-$NGINX_VERSION
apt install  -y
echo $NGINX_CONFIGURE_ARGS | xargs ./configure --add-dynamic-module=../ModSecurity-nginx --with-compat
make
mkdir /etc/nginx/modules/
cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules/
rm -rf /nginx-$NGINX_VERSION
# Installing & configuring OWASP core rule set:
cd /usr/local/
git clone https://github.com/coreruleset/coreruleset.git modsecurity-crs
cd modsecurity-crs
mv crs-setup.conf.example crs-setup.conf