package escom.ipn.mx.HolaSpring6CV3.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import escom.ipn.mx.HolaSpring6CV3.Model.UserModel;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByEmail(String email);
}

