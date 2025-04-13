#!/bin/bash

if [ ! -f rabbitmq-users-set ]; then
rabbitmq-server&
echo 'waiting for rabbitmq to start node' $RABBITMQ_NODENAME
while ! rabbitmqctl status 2>/dev/null >/dev/null; do sleep 1; done
echo 'rabbitmq started'
echo $RABBITMQ_API_GATEWAY_PASSWORD | rabbitmqctl add_user $RABBITMQ_API_GATEWAY_USER
rabbitmqctl set_permissions -p / $RABBITMQ_API_GATEWAY_USER ".*" ".*" ".*"
echo $RABBITMQ_USER_MANAGER_PASSWORD | rabbitmqctl add_user $RABBITMQ_USER_MANAGER_USER
rabbitmqctl set_permissions -p / $RABBITMQ_USER_MANAGER_USER ".*" ".*" ".*"
echo $RABBITMQ_FRIENDS_MANAGER_PASSWORD | rabbitmqctl add_user $RABBITMQ_FRIENDS_MANAGER_USER
rabbitmqctl set_permissions -p / $RABBITMQ_FRIENDS_MANAGER_USER ".*" ".*" ".*"
rabbitmqctl stop
touch rabbitmq-users-set
fi

exec rabbitmq-server