package escom.ipn.hola_spring_6IV3.repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import escom.ipn.hola_spring_6IV3.model.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByName(String name);

    // Método de depuración
    default List<String> getAllRoleNames() {
        return findAll().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
    }
}
