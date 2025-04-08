package escom.ipn.hola_spring_6IV3.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping()
public class ViewsController {

    // Redirige la raíz hacia la página de inicio
    @GetMapping("/")
    public String root() {
        return "redirect:/home";
    }

    @GetMapping("/admin/all-users")
    public String allUsersPage() {
        return "all-users";
    }

    @GetMapping("/my-profile")
    public String profile() {
        return "my-profile";
    }

    @GetMapping("/home")
    public String home() {
        return "home";
    }

    // Cambiado a "/libro-detalle" para coincidir con la plantilla HTML
    @GetMapping("/libro-detalle")
    public String bookDetails() {
        return "libro-detalle";
    }
    
    // Manejo de antigua ruta por compatibilidad
    @GetMapping("/book-details")
    public String oldBookDetails() {
        return "redirect:/libro-detalle";
    }
}
