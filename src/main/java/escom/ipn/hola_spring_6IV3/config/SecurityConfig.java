package escom.ipn.hola_spring_6IV3.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import escom.ipn.hola_spring_6IV3.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;

// Índica que es una clase de configuración de Spring
@Configuration
// Habilita la seguridad web en la aplicación
@EnableWebSecurity
// Genera un constructor con los campos finales requeridos
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationProvider authProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
        // Deshabilitar la protección contra Cross-Site Request Forgery (CSRF) (la configuración inicial de SpringSecurity)
            .csrf(csfr -> csfr.disable())
        // Permitir acceso a todoas las rutas que comiencen con "/auth/**"
            .authorizeHttpRequests(authRequest -> 
                authRequest
                // Permitir acceso a recursos estáticos
                .requestMatchers("/js/**", "/styles/**", "/css/**", "/images/**").permitAll()
                // Permitir acceso a las vistas y endpoints de login y signup
                .requestMatchers("/login", "/register", "/auth/login", "/auth/register", "/view/**").permitAll()
                // Permitir acceso los endpoints para el admin si y solo si el usuario es ADMIN
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
        // Configurar la politica de sesiones (STATELESS)
            .sessionManagement(sessionManager -> sessionManager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Configurar el proveedor de autenticación
            .authenticationProvider(authProvider)
        // Añadir el filtro de autenticación JWT antes del filtro de autenticación de nombre de usuario y contrasña
            // -> Add: JwtTokenProvider -> JwtService -> JwtAuthenticationFilter and then:
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        // Finalmente, construir el objeto
            .build();
    }
}
