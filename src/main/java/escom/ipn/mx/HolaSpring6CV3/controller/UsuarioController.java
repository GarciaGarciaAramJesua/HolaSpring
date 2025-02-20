package escom.ipn.mx.HolaSpring6CV3.controller;

/*import escom.ipn.mx.HolaSpring6CV3.dto.UsuarioDTO;*/
import escom.ipn.mx.HolaSpring6CV3.Model.Usuario;
import escom.ipn.mx.HolaSpring6CV3.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public ResponseEntity<String> registrarUsuario(@RequestBody UsuarioDTO usuarioDTO) {
        Usuario usuarioRegistrado = usuarioService.registrarUsuario(usuarioDTO);
        return ResponseEntity.ok("Usuario registrado con éxito: " + usuarioRegistrado.getEmail());
    }
}

