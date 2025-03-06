package escom.ipn.mx.HolaSpring6CV3.controller;

//import escom.ipn.mx.HolaSpring6CV3.DTO.UsuarioDTO;
import escom.ipn.mx.HolaSpring6CV3.Model.Role;
import escom.ipn.mx.HolaSpring6CV3.Model.UserModel;
import escom.ipn.mx.HolaSpring6CV3.service.RoleService;
import escom.ipn.mx.HolaSpring6CV3.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;

import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/usuarios")
public class UserController {

    @Autowired
    private UserService usuarioService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @GetMapping
    public String obtenerUsuarios(Model model) {
        ArrayList<UserModel> usuarios = usuarioService.obtenerUsuarios();
        model.addAttribute("usuarios", usuarios);
        return "admin";
    }

    //public UserController(UserService usuarioService) {
        //this.usuarioService = usuarioService;
    //}

    @GetMapping("/perfil")
    public String obtenerPerfil(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Optional<UserModel> usuario = usuarioService.obtenerUsuarioPorEmail(email);
        usuario.ifPresent(value -> model.addAttribute("usuario", value));
        return "profile";
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody UserModel usuario, @RequestParam String rolNombre) {
        try {    
            //usuario.setNombre(usuario.getNombre());
            //usuario.setEmail(usuario.getEmail());
            //usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

            //Set<Role> roles = new HashSet<>();
            //usuario.setRoles(usuario.getRoles());
            //if ("ROLE_ADMIN".equals(rol)) {
                //roles.add(roleService.findByName("ROLE_ADMIN"));
            //} else {
                //roles.add(roleService.findByName("ROLE_USER"));
            //} 
            //usuario.setRoles(roles);
            logger.info("Intentando registrar usuario: {}", usuario.getEmail());
            UserModel nuevoUsuario = usuarioService.registrarUsuario(usuario, rolNombre);
            logger.info("Usuario registrado exitosamente: {}", nuevoUsuario.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("mensaje", "Usuario registrado con éxito"));
        } catch (Exception e) {
            logger.error("Error en el registro", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error en el registro"));
        }
    }

    @GetMapping("/{id}")
    public Optional<UserModel> obtenerUsuarioPorId(@PathVariable Long id) {
        return usuarioService.obtenerUsuarioPorId(id);
    }

    @PutMapping("/{id}")
    public UserModel actualizarUsuarioPorId(@RequestBody UserModel request, @PathVariable Long id) {
        return usuarioService.actualizarPorId(request, id);
    }

    @DeleteMapping("/{id}")
    public String eliminarUsuarioPorId(@PathVariable("id") Long id) {
        boolean ok = this.usuarioService.eliminarUsuario(id);
        if (ok) {
            return "Usuario con id " + id + " eliminado con éxito";
        } else {
            return "Usuario no encontrado";
        }
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "usuarios/dashboard";
    }
}

