COMPOSE_FILE=./docker-compose.yml

detach=#-d

VOL_USER=$(shell whoami)

MICRO_SERVICES=$(shell find micro_services -mindepth 1 -maxdepth 1 -type d)

ENV_FILES=$(addsuffix /app/.env, ${MICRO_SERVICES})

NODE_MODULES=$(addsuffix /app/node_modules, ${MICRO_SERVICES}) front_end/app/node_modules

DIST_FILES=$(addsuffix /app/dist, ${MICRO_SERVICES}) front_end/app/game/dist

FRONT_BUILD=./front_end/app/dist

%.env:
	ln .env $@
%/node_modules:
	cd $(abspath ./$@/..) && npm install
${FRONT_BUILD}:
	cd $(abspath ./$@/..) && npm run build
%/dist:
	cd $(abspath ./$@/..) && npx tsc
all: ${ENV_FILES} ${NODE_MODULES} ${FRONT_BUILD} ${DIST_FILES} create_volumes_dir set-host-and-permission
	COMPOSE_BAKE=true docker compose -f ${COMPOSE_FILE} up ${detach}
build: ${ENV_FILES} ${NODE_MODULES} ${FRONT_BUILD} ${DIST_FILES} create_volumes_dir set-host-and-permission
	COMPOSE_BAKE=true docker compose -f ./vault/docker-compose-vault.yml up --build -d
	COMPOSE_BAKE=true docker compose -f ${COMPOSE_FILE} up --build ${detach}
clean:
	docker compose -f ${COMPOSE_FILE} down
	docker compose -f ./vault/docker-compose-vault.yml down
fclean: clean
	@echo "\033[0;31m==> Removing build files:\033[0m"
	sudo rm -rf ${FRONT_BUILD} ${ENV_FILES} ${NODE_MODULES} ${DIST_FILES}
re: fclean all

#Create docker persistent volumes
create_volumes_dir:
	@mkdir -p /home/${VOL_USER}/docker_volumes/api_gateway_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/user_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/friends_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/notifications_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/leaderboard_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/match_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/chat_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/rabbit_mq_log_volume
#Set host to fake route domains used to localhost
set-host-and-permission:
	@if ! grep -q "vault.transcendence.fr" /etc/hosts; then \
		sudo sh -c 'echo "127.0.0.1	www.transcendence.fr" >> /etc/hosts'; \
		sudo sh -c 'echo "127.0.0.1 transcendence.fr" >> /etc/hosts'; \
		sudo sh -c 'echo "127.0.0.1 vault.transcendence.fr" >> /etc/hosts'; \
	fi
#View running services
ps:
	docker ps -a
