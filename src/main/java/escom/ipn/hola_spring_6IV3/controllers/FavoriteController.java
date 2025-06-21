package escom.ipn.hola_spring_6IV3.controllers;

import escom.ipn.hola_spring_6IV3.dtos.FavoriteBookDetailsDto;
import escom.ipn.hola_spring_6IV3.dtos.FavoriteRequest;
import escom.ipn.hola_spring_6IV3.service.FavoriteService;
import escom.ipn.hola_spring_6IV3.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para operaciones de favoritos.
 * Maneja endpoints para gestionar los libros favoritos de los usuarios.
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final JwtService jwtService;

    /**
     * Obtiene todos los favoritos del usuario autenticado
     */
    @GetMapping
    public ResponseEntity<?> getUserFavorites(@RequestHeader("Authorization") String token) {
        try {
            String username = extractUsernameFromToken(token);
            List<FavoriteBookDetailsDto> favorites = favoriteService.getUserFavorites(username);
            
            Map<String, Object> response = new HashMap<>();
            response.put("favorites", favorites);
            response.put("count", favorites.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener favoritos: " + e.getMessage()));
        }
    }

    /**
     * Añade un libro a favoritos
     */
    @PostMapping("/{bookId}")
    public ResponseEntity<?> addToFavorites(
            @RequestHeader("Authorization") String token,
            @RequestBody FavoriteRequest request) {
        try {
            String username = extractUsernameFromToken(token);
            FavoriteBookDetailsDto favorite = favoriteService.addToFavorites(username, request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Libro añadido a favoritos", "favorite", favorite));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al añadir a favoritos: " + e.getMessage()));
        }
    }

    /**
     * Elimina un libro de favoritos
     */
    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> removeFromFavorites(
            @RequestHeader("Authorization") String token,
            @PathVariable String bookId) {
        try {
            String username = extractUsernameFromToken(token);
            favoriteService.removeFromFavorites(username, bookId);
            
            return ResponseEntity.ok(Map.of("message", "Libro eliminado de favoritos"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al eliminar de favoritos: " + e.getMessage()));
        }
    }

    /**
     * Verifica si un libro está en favoritos
     */
    @GetMapping("/check/{bookId}")
    public ResponseEntity<?> checkIfFavorite(
            @RequestHeader("Authorization") String token,
            @PathVariable String bookId) {
        try {
            String username = extractUsernameFromToken(token);
            boolean isFavorite = favoriteService.isBookInFavorites(username, bookId);
            
            return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al verificar favorito: " + e.getMessage()));
        }
    }

    /**
     * Alterna el estado de favorito (añadir/eliminar)
     */
    @PostMapping("/toggle")
    public ResponseEntity<?> toggleFavorite(
            @RequestHeader("Authorization") String token,
            @RequestBody FavoriteRequest request) {
        try {
            String username = extractUsernameFromToken(token);
            boolean isNowFavorite = favoriteService.toggleFavorite(username, request);
            
            String message = isNowFavorite ? "Libro añadido a favoritos" : "Libro eliminado de favoritos";
            
            return ResponseEntity.ok(Map.of(
                "message", message,
                "isFavorite", isNowFavorite
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al alternar favorito: " + e.getMessage()));
        }
    }

    /**
     * Obtiene el número de favoritos del usuario
     */
    @GetMapping("/count")
    public ResponseEntity<?> getFavoritesCount(@RequestHeader("Authorization") String token) {
        try {
            String username = extractUsernameFromToken(token);
            long count = favoriteService.getUserFavoritesCount(username);
            
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener contador de favoritos: " + e.getMessage()));
        }
    }

    /**
     * Extrae el nombre de usuario del token JWT
     */
    private String extractUsernameFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtService.extractUsername(token);
    }
}