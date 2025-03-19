package escom.ipn.hola_spring_6IV3.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import escom.ipn.hola_spring_6IV3.repository.UserRepository;
import escom.ipn.hola_spring_6IV3.service.JwtService;
import lombok.RequiredArgsConstructor;

/* 
UserDetailsService:
-> Este bean se encarga de cargar los detalles del usuario desde el repositorio de usuarios (UserRepository).

AuthenticationProvider:
-> Este bean configura el proveedor de autenticación utilizando DaoAuthenticationProvider, que se encarga de autenticar al usuario utilizando los detalles del usuario y el codificador de contraseñas.

AuthenticationManager:
-> Este bean proporciona el AuthenticationManager, que es el componente principal de Spring Security para manejar la autenticación.

PasswordEncoder:
-> Este bean configura el codificador de contraseñas utilizando BCryptPasswordEncoder, que es un algoritmo de hashing seguro para contraseñas.
*/

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserRepository userRepository;
    @SuppressWarnings("unused")
    private final JwtService jwtService;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
