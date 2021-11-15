start-emulators:
	docker-compose up -d

stop-emulators:
	docker-compose down

restart-emulators: stop-emulators start-emulators

deps:
	sudo npm install -g jest

test-all: test-backend

test-backend:
	cd backend; jest

test-frontend:
	cd frontend; jest
