package escom.ipn.hola_spring_6IV3.exception;

//Excepción lanzada cuando no se encuentra un usuario solicitado.
public class UserNotFoundException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public UserNotFoundException(String username) {
        super("El usuario '" + username + "' no fue encontrado.");
    }
}
