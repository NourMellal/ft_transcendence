#!/bin/sh

set -e
rabbitmq-server&


echo 'waiting for rabbitmq to start node' $RABBITMQ_NODENAME
while ! rabbitmqctl status 2>/dev/null >/dev/null; do sleep 1; done
echo $RABBITMQ_API_GATEWAY_PASSWORD | rabbitmqctl add_user $RABBITMQ_API_GATEWAY_USER
rabbitmqctl set_permissions -p / $RABBITMQ_API_GATEWAY_USER ".*" ".*" ".*"
echo $RABBITMQ_USER_MANAGER_PASSWORD | rabbitmqctl add_user $RABBITMQ_USER_MANAGER_USER
rabbitmqctl set_permissions -p / $RABBITMQ_USER_MANAGER_USER ".*" ".*" ".*"
echo $RABBITMQ_FRIENDS_MANAGER_PASSWORD | rabbitmqctl add_user $RABBITMQ_FRIENDS_MANAGER_USER
rabbitmqctl set_permissions -p / $RABBITMQ_FRIENDS_MANAGER_USER ".*" ".*" ".*"
echo $RABBITMQ_NOTIFICATIONS_PASSWORD | rabbitmqctl add_user $RABBITMQ_NOTIFICATIONS_USER
rabbitmqctl set_permissions -p / $RABBITMQ_NOTIFICATIONS_USER ".*" ".*" ".*"
echo $RABBITMQ_LEADERBOARD_PASSWORD | rabbitmqctl add_user $RABBITMQ_LEADERBOARD_USER
rabbitmqctl set_permissions -p / $RABBITMQ_LEADERBOARD_USER ".*" ".*" ".*"