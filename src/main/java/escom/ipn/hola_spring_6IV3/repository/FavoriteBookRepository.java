package escom.ipn.hola_spring_6IV3.repository;

import escom.ipn.hola_spring_6IV3.model.Favorite;
import escom.ipn.hola_spring_6IV3.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteBookRepository extends JpaRepository<Favorite, Long> {
    
    /**
     * Encuentra todos los favoritos de un usuario específico
     */
    List<Favorite> findByUserOrderByAddedDateDesc(User user);
    
    /**
     * Encuentra todos los favoritos de un usuario por su username
     */
    @Query("SELECT f FROM Favorite f WHERE f.user.username = :username ORDER BY f.addedDate DESC")
    List<Favorite> findByUsernameOrderByAddedDateDesc(@Param("username") String username);
    
    /**
     * Verifica si un libro específico ya está en favoritos de un usuario
     */
    @Query("SELECT f FROM Favorite f WHERE f.user.username = :username AND f.bookId = :bookId")
    Optional<Favorite> findByUsernameAndBookId(@Param("username") String username, @Param("bookId") String bookId);
    
    /**
     * Verifica si un libro está en favoritos (true/false)
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Favorite f WHERE f.user.username = :username AND f.bookId = :bookId")
    boolean existsByUsernameAndBookId(@Param("username") String username, @Param("bookId") String bookId);
    
    /**
     * Elimina un favorito específico por usuario y bookId
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Favorite f WHERE f.user.username = :username AND f.bookId = :bookId")
    int deleteByUsernameAndBookId(@Param("username") String username, @Param("bookId") String bookId);
    
    /**
     * Método alternativo usando Spring Data JPA naming convention
     */
    @Modifying
    @Transactional
    void deleteByUserUsernameAndBookId(String username, String bookId);
    
    /**
     * Cuenta el número total de favoritos de un usuario
     */
    @Query("SELECT COUNT(f) FROM Favorite f WHERE f.user.username = :username")
    long countByUsername(@Param("username") String username);
}