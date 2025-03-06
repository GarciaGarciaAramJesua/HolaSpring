package escom.ipn.mx.HolaSpring6CV3.controller;

import escom.ipn.mx.HolaSpring6CV3.Model.UserModel;
import escom.ipn.mx.HolaSpring6CV3.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;


@Controller
public class LoginController {

    @Autowired
    private UserService userService;
    
    @GetMapping("/login")
    public String login() {
        return "index";
    }

    @GetMapping("/usuarios/registro")
    public String register() {
        return "register";
    }


    //@PostMapping
    //public ResponseEntity<String> login(@RequestBody UserModel user) {
        // Validar que el email y la contraseña no estén vacíos
        //if (user.getEmail() == null || user.getEmail().isEmpty()) {
        //    return ResponseEntity.badRequest().body("El email es obligatorio");
        //}
        //if (user.getPassword() == null || user.getPassword().isEmpty()) {
        //    return ResponseEntity.badRequest().body("La contraseña es obligatoria");
        //}

        // Verificar las credenciales del usuario
        //boolean isValidUser = userService.validateUser(user.getEmail(), user.getPassword());
        //if (isValidUser) {
        //    return ResponseEntity.ok("Login exitoso");
        //} else {
        //    return ResponseEntity.status(401).body("Credenciales inválidas");
        //}
    //}

    

    

}