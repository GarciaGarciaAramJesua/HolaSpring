# Imagen base para compilar y desarrollo
FROM maven:3.9-eclipse-temurin-21-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Instala herramientas necesarias
RUN apk add --no-cache bash netcat-openbsd mysql-client dos2unix

# Copia el archivo pom.xml para descargar dependencias
COPY pom.xml .

# Descarga dependencias
RUN mvn dependency:go-offline -B

# Copia el script start.sh
COPY start.sh .

# Convierte los finales de línea y establece permisos
RUN dos2unix /app/start.sh && \
    chmod +x /app/start.sh

# Punto de entrada usando bash
ENTRYPOINT ["/bin/bash", "/app/start.sh"]