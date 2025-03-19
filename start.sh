#!/bin/bash
# No set -e, lo manejamos con comandos individuales

echo "Waiting for MySQL to be available..."
while ! nc -z mysql 3306; do
  echo "MySQL not available yet - waiting..."
  sleep 2
done
echo "MySQL is up and running!"

echo "Starting Spring Boot application in development mode..."
exec mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true -Dspring.devtools.livereload.enabled=true"