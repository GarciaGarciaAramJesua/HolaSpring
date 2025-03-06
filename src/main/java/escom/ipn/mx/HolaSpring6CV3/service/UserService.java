package escom.ipn.mx.HolaSpring6CV3.service;

//import escom.ipn.mx.HolaSpring6CV3.DTO.UsuarioDTO;
import escom.ipn.mx.HolaSpring6CV3.Model.UserModel;
import escom.ipn.mx.HolaSpring6CV3.Model.Role;
import escom.ipn.mx.HolaSpring6CV3.repository.RoleRepository;
import escom.ipn.mx.HolaSpring6CV3.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService {
    @Autowired
    private RoleRepository roleRepository;
    private RoleService roleService;
    private UserRepository usuarioRepository;
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository usuarioRepository, RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public UserModel registrarUsuario(UserModel usuario, String rolNombre) {
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("El correo ya está en uso");
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        Optional<Role> rol = roleRepository.findByNombre(rolNombre);
        if (rol.isEmpty()) {
            throw new IllegalArgumentException("El rol no existe.");
        }
        usuario.setRoles(Set.of(rol.get()));

        //Set<Role> roles = new HashSet<>();
        //Role rol = roleService.findByName("ROLE_" + rolNombre.toUpperCase());
        //if (rol == null) {
            //throw new RuntimeException("Rol no encontrado.");
        //}
        //roles.add(rol);
        //usuario.setRoles(roles);

        return usuarioRepository.save(usuario);
    }

    public ArrayList<UserModel> obtenerUsuarios() {
        return (ArrayList<UserModel>) usuarioRepository.findAll();
    }

    public Optional<UserModel> obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public UserModel actualizarPorId(UserModel request, Long id){
        //Optional<Usuario> usuario = usuarioRepository.findById(id);
        UserModel usuario = usuarioRepository.findById(id).get();
        usuario.setNombre(null != request.getNombre() ? request.getNombre() : usuario.getNombre());
        usuario.setEmail(null != request.getEmail() ? request.getEmail() : usuario.getEmail());
        usuario.setPassword(null != request.getPassword() ? passwordEncoder.encode(request.getPassword()) : usuario.getPassword());
        return usuarioRepository.save(usuario);
    }

    public Boolean eliminarUsuario(Long id){
        try {
            usuarioRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateUser(String email, String password) {
        Optional<UserModel> user = usuarioRepository.findByEmail(email);
        return user.isPresent() && passwordEncoder.matches(password, user.get().getPassword());
    }

    public Optional<UserModel> obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }
}
