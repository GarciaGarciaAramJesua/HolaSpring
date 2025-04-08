package escom.ipn.hola_spring_6IV3.repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import escom.ipn.hola_spring_6IV3.model.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    //Modificado para manejar duplicados tomando el primer resultado
    @Query("SELECT r FROM Role r WHERE r.name = :name ORDER BY r.id ASC")
    Optional<Role> findByName(@Param("name") String name);
    
    //Método para verificar si existen duplicados de un rol
    @Query("SELECT COUNT(r) FROM Role r WHERE r.name = :name")
    long countByName(@Param("name") String name);

    // Método de depuración
    default List<String> getAllRoleNames() {
        return findAll().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
    }

    //Método para obtener todos los roles duplicados
    // Se agrupan por nombre y se cuentan, luego se filtran aquellos con más de 1 ocurrencia
    @Query("SELECT r.name, COUNT(r) as count FROM Role r GROUP BY r.name HAVING COUNT(r) > 1")
    List<Object[]> findDuplicateRoles();
}
