package escom.ipn.hola_spring_6IV3.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import escom.ipn.hola_spring_6IV3.model.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
}
