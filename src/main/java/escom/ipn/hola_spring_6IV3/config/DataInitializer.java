package escom.ipn.hola_spring_6IV3.config;

import escom.ipn.hola_spring_6IV3.model.Role;
import escom.ipn.hola_spring_6IV3.model.User;
import escom.ipn.hola_spring_6IV3.repository.RoleRepository;
import escom.ipn.hola_spring_6IV3.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, RoleRepository roleRepository) {
        return args -> {
            if(userRepository.findByUsername("sudo").isEmpty()) {
                // Buscar el rol ADMIN en lugar de crearlo
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                        .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));

                User user = User.builder()
                        .username("sudo")
                        .lastname("admin")
                        .firstname("admin")
                        .country("Papua Nueva Guinea")
                        .password(new BCryptPasswordEncoder().encode("password"))
                        .role(adminRole)
                        .build();
                userRepository.save(user);
                System.out.println("Usuario admin creado con rol ADMIN.");
            } else {
                System.out.println("Usuario admin con rol ADMIN ya existe en el sistema.");
            }
        };
    }
}