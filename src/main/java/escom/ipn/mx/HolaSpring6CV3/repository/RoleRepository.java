package escom.ipn.mx.HolaSpring6CV3.repository;

import escom.ipn.mx.HolaSpring6CV3.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNombre(String nombre);
}
