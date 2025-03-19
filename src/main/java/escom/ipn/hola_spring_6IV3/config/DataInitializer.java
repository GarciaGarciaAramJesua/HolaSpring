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
            Role role = new Role();
            role.setName("ROLE_ADMIN");
            roleRepository.save(role);

            User user = User.builder()
                    .username("sudo")
                    .lastname("user")
                    .firstname("super")
                    .country("not defined")
                    .password(new BCryptPasswordEncoder().encode("password"))
                    .role(role)
                    .build();
            userRepository.save(user);
        };
    }
}