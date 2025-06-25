package escom.ipn.hola_spring_6IV3.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import escom.ipn.hola_spring_6IV3.dtos.UserDto;
import escom.ipn.hola_spring_6IV3.exception.UserNotFoundException;
import escom.ipn.hola_spring_6IV3.model.User;
import escom.ipn.hola_spring_6IV3.service.JwtService;
import escom.ipn.hola_spring_6IV3.service.UserService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserRestController {

    private final UserService userService;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @GetMapping("/info")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String token) {
        try{
            String username = userService.extractUsernameFromToken(token);
            User user = userService.getUserByUsername(username);
            Map<String, Object> claims = userService.extractAllInfoFromToken(token);
            return ResponseEntity.ok(Map.of("claims", claims, "usuario", user));
        }catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error al encontrar el usuario: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor: " + e.getMessage());
        }
    }

    @GetMapping("/admin/all-info")
    public ResponseEntity<?> getAllUsersInfo(@RequestHeader("Authorization") String token) {
        try{
            System.out.println("Token recibido: " + token);
            List<UserDto> users = userService.getAllUsersDto();
            System.out.println("Usuarios encontrados: " + users.size());
            users.forEach(u -> System.out.println("Usuario: " + u.getUsername()));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor: " + e.getMessage());
        }
    }
    
    @PutMapping("/update")
    public ResponseEntity<?> updateUser(@RequestHeader("Authorization") String token, @RequestBody UserDto updatedUserDto) {
        try{
            String username = userService.extractUsernameFromToken(token);
            User user = userService.getUserByUsername(username);
            
            // Registrar los datos recibidos para depuración
            System.out.println("DTO recibido para actualización: " + updatedUserDto);
            System.out.println("Usuario original: " + user);

            // Configurar updatedUserDto para no actualizar el rol
            updatedUserDto.setRole(user.getRole().getName().replace("ROLE_", ""));

            // Configurar updatedUserDto para no actualizar la contraseña
            if (updatedUserDto.getPassword() == null || updatedUserDto.getPassword().isEmpty()) {    
                updatedUserDto.setPassword(null);
            }

            User updated = userService.updateUser(user, updatedUserDto);

            // Generate a new token with updated roles
            UserDetails userDetails = userDetailsService.loadUserByUsername(updated.getUsername());
            String newToken = jwtService.getToken(userDetails);

            // Usar HashMap en lugar de Map.of para evitar limitaciones
            Map<String, Object> response = new HashMap<>();
            response.put("user", updated);
            response.put("token", newToken);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error al encontrar el usuario: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor: " + e.getMessage());
        }
    }

    @PutMapping("/admin/update/{username}")
    public ResponseEntity<?> updateUserByAdmin(@RequestHeader("Authorization") String token, @PathVariable String username, @RequestBody UserDto updatedUserDto) {
        try{
            User user = userService.getUserByUsername(username);
            User updated = userService.updateUser(user, updatedUserDto);
            return ResponseEntity.ok(Map.of("user", updated));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error al encontrar el usuario: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor: " + e.getMessage());
        }
    }

    @DeleteMapping("/admin/delete/{username}")
    public ResponseEntity<?> deleteUser(@RequestHeader("Authorization") String token, @PathVariable String username) {
        try{
            userService.deleteUserByUsername(username);
            return ResponseEntity.ok().build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error al encontrar el usuario: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error interno del servidor: " + e.getMessage());
        }
    }
}
