package escom.ipn.mx.HolaSpring6CV3.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class HolaSpring6CV3Controller {
    @GetMapping("/")
    public String holaMundo(Model model) {
        model.addAttribute("mensaje", "Hola Spring");
        return "Hola Spring"; // Nombre de la plantilla HTML (src/main/resources/templates/index.html)
    }
}
