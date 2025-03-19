package escom.ipn.hola_spring_6IV3.controllers;

import java.util.List;
import java.util.Map;

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
        String username = userService.extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);
        Map<String, Object> claims = userService.extractAllInfoFromToken(token);
        return ResponseEntity.ok(Map.of("claims", claims, "usuario", user));
    }

    @GetMapping("/admin/all-info")
    public ResponseEntity<?> getAllUsersInfo(@RequestHeader("Authorization") String token) {
        List<UserDto> users = userService.getAllUsersDto();
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/update")
    public ResponseEntity<?> updateUser(@RequestHeader("Authorization") String token, @RequestBody UserDto updatedUserDto) {
        String username = userService.extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);
        
        // Configurar updatedUserDto para no actualizar el rol
        updatedUserDto.setRole(user.getRole().toString());

        // Configurar updatedUserDto para no actualizar la contraseña
        updatedUserDto.setPassword(null);
        
        User updated = userService.updateUser(user, updatedUserDto);

        // Generate a new token with updated roles
        UserDetails userDetails = userDetailsService.loadUserByUsername(updated.getUsername());
        String newToken = jwtService.getToken(userDetails);

        return ResponseEntity.ok(Map.of("user", updated, "token", newToken));
    }

    @PutMapping("/admin/update/{username}")
    public ResponseEntity<?> updateUserByAdmin(@RequestHeader("Authorization") String token, @PathVariable String username, @RequestBody UserDto updatedUserDto) {
        User user = userService.getUserByUsername(username);

        User updated = userService.updateUser(user, updatedUserDto);

        return ResponseEntity.ok(Map.of("user", updated));
    }

    @DeleteMapping("/admin/delete/{username}")
    public ResponseEntity<?> deleteUser(@RequestHeader("Authorization") String token, @PathVariable String username) {
        userService.deleteUserByUsername(username);
        return ResponseEntity.ok().build();
    }
}
