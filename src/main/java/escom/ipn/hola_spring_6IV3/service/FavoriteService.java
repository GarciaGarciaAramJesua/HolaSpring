package escom.ipn.hola_spring_6IV3.service;

import escom.ipn.hola_spring_6IV3.dtos.FavoriteBookDetailsDto;
import escom.ipn.hola_spring_6IV3.model.Favorite;
import escom.ipn.hola_spring_6IV3.model.User;
import escom.ipn.hola_spring_6IV3.dtos.FavoriteRequest;
import escom.ipn.hola_spring_6IV3.repository.FavoriteBookRepository;
import escom.ipn.hola_spring_6IV3.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FavoriteService {
    
    @Autowired
    private FavoriteBookRepository favoriteRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Obtiene todos los favoritos de un usuario
     */
    public List<FavoriteBookDetailsDto> getUserFavorites(String username) {
        List<Favorite> favorites = favoriteRepository.findByUsernameOrderByAddedDateDesc(username);
        return favorites.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Añade un libro a favoritos
     */
    @Transactional
    public FavoriteBookDetailsDto addToFavorites(String username, FavoriteRequest request) {
        // Verificar si el usuario existe
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
        
        // Verificar si el libro ya está en favoritos
        if (favoriteRepository.existsByUsernameAndBookId(username, request.getBookId())) {
            throw new RuntimeException("El libro ya está en favoritos");
        }
        
        // Crear nuevo favorito
        Favorite favorite = new Favorite(user, request.getBookId(), request.getBookTitle(), request.getBookCoverId());
        Favorite savedFavorite = favoriteRepository.save(favorite);
        
        return convertToDTO(savedFavorite);
    }
    
    /**
     * Elimina un libro de favoritos
     */
    @Transactional
    public void removeFromFavorites(String username, String bookId) {
        // Verificar si el favorito existe
        Optional<Favorite> favorite = favoriteRepository.findByUsernameAndBookId(username, bookId);
        if (favorite.isEmpty()) {
            throw new RuntimeException("El libro no está en favoritos");
        }
        
        try {
            // Usar el método más confiable de Spring Data JPA
            favoriteRepository.deleteByUserUsernameAndBookId(username, bookId);
        } catch (Exception e) {
            // Si falla, intentar con el favorito específico encontrado
            favoriteRepository.delete(favorite.get());
        }
    }
    
    /**
     * Verifica si un libro está en favoritos
     */
    public boolean isBookInFavorites(String username, String bookId) {
        return favoriteRepository.existsByUsernameAndBookId(username, bookId);
    }
    
    /**
     * Obtiene el número total de favoritos de un usuario
     */
    public long getUserFavoritesCount(String username) {
        return favoriteRepository.countByUsername(username);
    }
    
    /**
     * Alterna el estado de favorito de un libro (añadir/eliminar)
     */
    @Transactional
    public boolean toggleFavorite(String username, FavoriteRequest request) {
        if (isBookInFavorites(username, request.getBookId())) {
            removeFromFavorites(username, request.getBookId());
            return false; // Eliminado de favoritos
        } else {
            addToFavorites(username, request);
            return true; // Añadido a favoritos
        }
    }
    
    /**
     * Convierte una entidad Favorite a DTO
     */
    private FavoriteBookDetailsDto convertToDTO(Favorite favorite) {
        return new FavoriteBookDetailsDto(
            favorite.getId(),
            favorite.getBookId(),
            favorite.getBookTitle(),
            favorite.getBookCoverId(),
            favorite.getAddedDate()
        );
    }
}
