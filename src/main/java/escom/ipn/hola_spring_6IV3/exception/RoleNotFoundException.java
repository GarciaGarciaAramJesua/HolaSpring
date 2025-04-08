package escom.ipn.hola_spring_6IV3.exception;
// Excepción lanzada cuando no se encuentra un rol solicitado.
public class RoleNotFoundException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    public RoleNotFoundException(String roleName) {
        super("El rol '" + roleName + "' no fue encontrado.");
    }
}