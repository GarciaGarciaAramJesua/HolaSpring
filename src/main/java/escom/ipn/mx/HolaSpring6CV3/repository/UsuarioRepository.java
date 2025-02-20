package escom.ipn.mx.HolaSpring6CV3.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import escom.ipn.mx.HolaSpring6CV3.model.Usuario;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
}

