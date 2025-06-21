# Imagen base para compilar y desarrollo
FROM maven:3.9-eclipse-temurin-21-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Instala herramientas necesarias
RUN apk add --no-cache bash mysql-client

# Copia el archivo pom.xml para descargar dependencias
COPY pom.xml .

# Descarga dependencias
RUN mvn dependency:go-offline -B

# Copia el código fuente de la aplicación
COPY ./ app 

# Punto de entrada usando bash
CMD ["mvn", "spring-boot:run"]