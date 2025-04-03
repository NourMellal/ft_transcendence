COMPOSE_FILE=./docker-compose.yml
USERNAME=msitni

all: create_volumes_dir
	sudo docker compose -f ${COMPOSE_FILE} up -d
build: create_volumes_dir set-host
	sudo docker compose -f ${COMPOSE_FILE} up --build
clean:
	sudo docker compose -f ${COMPOSE_FILE} down
re: clean all

#Create docker persistent volumes
create_volumes_dir:
	@sudo mkdir -p /home/${USERNAME}/data/api_gateway_db_volume
#Set host to fake route domains used to localhost
set-host:
	@if ! grep -q "server.transcendence.fr" /etc/hosts; then \
		sudo echo "127.0.0.1	server.transcendence.fr" >> /etc/hosts; \
	else \
		echo "Host already added"; \
	fi
#View running services
ps:
	sudo docker ps -a