package escom.ipn.hola_spring_6IV3;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class HolaMundoApplication {

    public static void main(String[] args) {
        // Intenta cargar las variables de entorno, pero no falla si no encuentra el archivo
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            dotenv.entries().forEach(entry -> {
                // Solo establecemos la propiedad si no está ya definida en el entorno
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
            System.out.println("Archivo .env cargado correctamente.");
        } catch (Exception e) {
            System.out.println("No se pudo cargar el archivo .env. Usando variables de entorno del sistema.");
        }
        
        SpringApplication.run(HolaMundoApplication.class, args);
    }
}