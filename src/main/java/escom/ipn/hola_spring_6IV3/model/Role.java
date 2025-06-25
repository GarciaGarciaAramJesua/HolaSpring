package escom.ipn.hola_spring_6IV3.model;

import escom.ipn.hola_spring_6IV3.exception.RoleNotFoundException;

public enum Role {
    ROLE_USER("ROLE_USER"),
    ROLE_ADMIN("ROLE_ADMIN");
    
    private final String name;
    
    Role(String name) {
        this.name = name;
    }
    
    public String getName() {
        return name;
    }
    
    // Método helper para convertir de String a Enum
    public static Role fromString(String roleStr) throws RoleNotFoundException {
        // Si el roleStr es null, usa ROLE_USER por defecto
        if (roleStr == null || roleStr.trim().isEmpty()) {
            return ROLE_USER;
        }
        
        for (Role role : Role.values()) {
            // Comprueba si coincide con o sin el prefijo ROLE_
            if (role.name.equals(roleStr.toUpperCase()) || 
                role.name.equals("ROLE_" + roleStr.toUpperCase())) {
                return role;
            }
        }
        throw new RoleNotFoundException(roleStr);
    }
    
    // Para obtener el nombre sin el prefijo "ROLE_"
    public String getSimpleName() {
        return name.replace("ROLE_", "");
    }
}
