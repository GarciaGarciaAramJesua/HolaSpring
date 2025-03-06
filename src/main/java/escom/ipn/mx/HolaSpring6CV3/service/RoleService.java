package escom.ipn.mx.HolaSpring6CV3.service;

import escom.ipn.mx.HolaSpring6CV3.Model.Role;
import escom.ipn.mx.HolaSpring6CV3.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public Role findByName(String nombre) {
        return roleRepository.findByNombre(nombre).orElse(null);
    }
}
