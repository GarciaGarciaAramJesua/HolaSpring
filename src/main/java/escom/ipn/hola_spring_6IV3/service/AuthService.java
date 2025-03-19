package escom.ipn.hola_spring_6IV3.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import escom.ipn.hola_spring_6IV3.dtos.JwtResponse;
import escom.ipn.hola_spring_6IV3.dtos.LoginRequest;
import escom.ipn.hola_spring_6IV3.dtos.RegisterRequest;
import escom.ipn.hola_spring_6IV3.model.Role;
import escom.ipn.hola_spring_6IV3.model.User;
import escom.ipn.hola_spring_6IV3.repository.RoleRepository;
import escom.ipn.hola_spring_6IV3.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    // Método para registrar un nuevo usuario
    public JwtResponse registerUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso.");
        }

        // Obtener el rol correspondiente
        Role role = roleRepository.findByName("ROLE_" + request.getRole().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        // Crear el nuevo usuario
        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstname(request.getFirstName())
            .lastname(request.getLastName())
            .country(request.getCountry())
            .role(role)
            .build();

        // Guardar el usuario en la BD
        userRepository.save(user);
        
        // Generar el token JWT
        String token = jwtService.getToken(user);
        
        return JwtResponse.builder()
            .token(token)
            .build();
    }

    // Método para autenticar usuario y generar JWT
    public JwtResponse loginUser(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        UserDetails user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        String token = jwtService.getToken(user);
        return new JwtResponse(token);
    }
}
