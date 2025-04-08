package escom.ipn.hola_spring_6IV3.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

import escom.ipn.hola_spring_6IV3.repository.RoleRepository;

/**
 * Configuración para detectar y corregir roles duplicados en la base de datos.
 */
@Configuration
public class RoleDuplicateResolver {
    
    /**
     * Bean que se ejecuta al inicio para detectar y corregir roles duplicados.
     * @param jdbcTemplate Para ejecutar consultas SQL directas
     * @param roleRepository Repositorio de roles
     * @return CommandLineRunner que ejecuta el código de corrección
     */
    @Bean
    @Profile("!test") // No ejecutar en pruebas
    public CommandLineRunner fixDuplicateRoles(JdbcTemplate jdbcTemplate, RoleRepository roleRepository) {
        return args -> {
            System.out.println("Verificando duplicados en roles...");
            
            // Obtener todos los roles duplicados
            List<Object[]> duplicates = roleRepository.findDuplicateRoles();
            
            if (duplicates.isEmpty()) {
                System.out.println("No se encontraron roles duplicados.");
                return;
            }
            
            System.out.println("Se encontraron " + duplicates.size() + " roles duplicados. Iniciando corrección...");
            
            // Para cada rol duplicado, mantener uno y actualizar referencias a los demás
            for (Object[] duplicate : duplicates) {
                String roleName = (String) duplicate[0];
                System.out.println("Corrigiendo duplicados para rol: " + roleName);
                
                // Obtener IDs de todos los roles con este nombre
                List<Integer> roleIds = jdbcTemplate.queryForList(
                        "SELECT id FROM role WHERE name = ?", 
                        Integer.class, 
                        roleName);
                
                // Mantener el primer ID (el más antiguo normalmente)
                Integer keepId = roleIds.get(0);
                roleIds.remove(0);
                
                if (!roleIds.isEmpty()) {
                    System.out.println("Manteniendo rol con ID " + keepId + " y reasignando usuarios de roles con IDs: " + roleIds);
                    
                    // Para cada ID duplicado, actualizar usuarios y luego eliminar el rol
                    for (Integer duplicateId : roleIds) {
                        // Actualizar usuarios que usan este rol
                        int updated = jdbcTemplate.update(
                                "UPDATE user SET role_id = ? WHERE role_id = ?",
                                keepId, duplicateId);
                        
                        System.out.println("Actualizados " + updated + " usuarios del rol ID " + duplicateId + " al rol ID " + keepId);
                        
                        // Eliminar el rol duplicado
                        jdbcTemplate.update("DELETE FROM role WHERE id = ?", duplicateId);
                        System.out.println("Eliminado rol duplicado con ID " + duplicateId);
                    }
                }
            }
            
            System.out.println("Corrección de roles duplicados completada.");
        };
    }
}