package escom.ipn.hola_spring_6IV3.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import escom.ipn.hola_spring_6IV3.dtos.UserDto;
import escom.ipn.hola_spring_6IV3.model.Role;
import escom.ipn.hola_spring_6IV3.model.User;
import escom.ipn.hola_spring_6IV3.repository.RoleRepository;
import escom.ipn.hola_spring_6IV3.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public User getUserById(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<UserDto> getAllUsersDto() {
        return userRepository.findAll().stream()
                .map(user -> UserDto.builder()
                        .username(user.getUsername())
                        .firstname(user.getFirstname())
                        .lastname(user.getLastname())
                        .country(user.getCountry())
                        .role(user.getRole().getName().replace("ROLE_", "")) // Remove the prefix for display
                        .build())
                .collect(Collectors.toList());
    }
    
    @Transactional
    public User updateUser(User user, UserDto updatedUserDto) {
        // Actualizar datos básicos
        if (updatedUserDto.getFirstname() != null) {
            user.setFirstname(updatedUserDto.getFirstname());
        }
        if (updatedUserDto.getLastname() != null) {
            user.setLastname(updatedUserDto.getLastname());
        }
        if (updatedUserDto.getCountry() != null) {
            user.setCountry(updatedUserDto.getCountry());
        }

        // Si hay un rol en la solicitud, actualizarlo
        if (updatedUserDto.getRole() != null && !updatedUserDto.getRole().isEmpty()) {
            Role role = roleRepository.findByName("ROLE_" + updatedUserDto.getRole().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
            user.setRole(role);
        }

        // Solo actualizar la contraseña si explícitamente se proporciona
        if (updatedUserDto.getPassword() != null && !updatedUserDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updatedUserDto.getPassword()));
        }

        return userRepository.save(user);
    }

    public String extractUsernameFromToken(String token) {
        return jwtService.extractUsername(token.replace("Bearer ", ""));
    }

    public Map<String, Object> extractAllInfoFromToken(String token) {
        return jwtService.extractAllInfo(token.replace("Bearer ", ""));
    }

    public void deleteUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        userRepository.delete(user);
    }
}
