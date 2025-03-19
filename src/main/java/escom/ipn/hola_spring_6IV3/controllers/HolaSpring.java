package escom.ipn.hola_spring_6IV3.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HolaSpring {
    @GetMapping("/hola")
    public String holaSpring() {
        return "¡Hola Spring!";
    }
}
