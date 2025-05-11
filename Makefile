COMPOSE_FILE=./docker-compose.yml

detach=#-d

VOL_USER=$(shell whoami)

MICRO_SERVICES=$(shell find micro_services -mindepth 1 -maxdepth 1 -type d)

ENV_FILES=$(addsuffix /app/.env, ${MICRO_SERVICES})

%.env:
	ln .env $@

all: ${ENV_FILES} create_volumes_dir set-host-and-permission
	docker compose -f ${COMPOSE_FILE} up ${detach}
build: ${ENV_FILES} create_volumes_dir set-host-and-permission
	docker compose -f ${COMPOSE_FILE} up --build ${detach}
clean:
	docker compose -f ${COMPOSE_FILE} down
re: clean all

#Create docker persistent volumes
create_volumes_dir:
	@mkdir -p /home/${VOL_USER}/docker_volumes/api_gateway_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/user_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/friends_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/notifications_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/leaderboard_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/static_data_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/rabbit_mq_log_volume
#Set host to fake route domains used to localhost
set-host-and-permission:
	@if ! grep -q "www.transcendence.fr" /etc/hosts; then \
		sudo sh -c 'echo "127.0.0.1	www.transcendence.fr" >> /etc/hosts'; \
		sudo sh -c 'echo "127.0.0.1 transcendence.fr" >> /etc/hosts'; \
	fi
#View running services
ps:
	docker ps -a
