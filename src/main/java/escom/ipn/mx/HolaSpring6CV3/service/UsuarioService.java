package escom.ipn.mx.HolaSpring6CV3.service;

import escom.ipn.mx.HolaSpring6CV3.dto.UsuarioDTO;
import escom.ipn.mx.HolaSpring6CV3.model.Usuario;
import escom.ipn.mx.HolaSpring6CV3.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Usuario registrarUsuario(UsuarioDTO usuarioDTO) {
        Usuario usuario = new Usuario();
        usuario.setEmail(usuarioDTO.getEmail());
        usuario.setPassword(passwordEncoder.encode(usuarioDTO.getPassword())); // Encriptar contraseña
        return usuarioRepository.save(usuario);
    }
}
