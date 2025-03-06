package escom.ipn.mx.HolaSpring6CV3;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConnectionChecker implements CommandLineRunner {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("SELECT 1");
            System.out.println("Conexión a la base de datos establecida correctamente.");
        } catch (Exception e) {
            System.err.println("Error al conectar con la base de datos: " + e.getMessage());
        }
    }
}
