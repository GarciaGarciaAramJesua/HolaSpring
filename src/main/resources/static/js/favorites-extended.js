/**
 * Funciones extendidas para manejar favoritos
 * Se integran con las implementaciones existentes de favoritos
 */

// Constantes de API
const FAVORITES_API = {
    BASE: '/api/favorites',
    TOGGLE: '/api/favorites/toggle',
    CHECK: '/api/favorites/check',
    COUNT: '/api/favorites/count',
    RECOMMENDATIONS: '/api/favorites/recommendations'
};

/**
 * Versión extendida y mejorada de loadFavorites()
 */
function enhancedLoadFavorites() {
    const container = document.getElementById('favorites-books-container');
    if (!container) return;
    
    // Mostrar un indicador de carga
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    // Obtener favoritos del usuario autenticado
    fetch('/api/favorites', {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error obteniendo favoritos');
        return res.json();
    })
    .then(data => {
        const favorites = Array.isArray(data) ? data : (data.favorites || []);
        
        // Actualizar contador si existe
        const counter = document.querySelector('.favorites-count');
        if (counter) counter.textContent = favorites.length;
        
        // Mostrar mensaje si no hay favoritos
        if (!favorites || favorites.length === 0) {
            container.innerHTML = `
                <div class="no-favorites">
                    <i class="far fa-heart"></i>
                    <p>No tienes libros favoritos.</p>
                    <p class="sub-message">Explora y marca libros como favoritos para verlos aquí.</p>
                </div>
            `;
            return;
        }
        
        // Preparar datos para renderizado
        const favoriteBooks = favorites.map(favorite => ({
            id: favorite.bookId,
            title: favorite.bookTitle || 'Título desconocido',
            authors: favorite.authors || 'Autor desconocido',
            coverUrl: favorite.bookCoverId 
                ? `https://covers.openlibrary.org/b/id/${favorite.bookCoverId}-M.jpg` 
                : DEFAULT_COVER,
            isFavorite: true
        }));
        
        // Renderizar usando la función existente
        renderBooksWithoutSwiper(favoriteBooks, container, 
            favorites.map(f => f.bookId)); // Pasar IDs para marcar como favoritos
    })
    .catch(error => {
        console.error('Error obteniendo favoritos:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No se pudieron cargar los favoritos.</p>
            </div>
        `;
    });
}

/**
 * Si la función original de loadFavorites existe, extenderla
 */
document.addEventListener('DOMContentLoaded', () => {
    // Solo extender si no estamos en la página de favoritos específica
    if (window.location.pathname !== '/favoritos') {
        // Guardar la función original si existe
        if (typeof window.loadFavorites === 'function') {
            const originalLoadFavorites = window.loadFavorites;
            
            // Reemplazar con versión que llama a ambas
            window.loadFavorites = function() {
                // Intentar llamar a la original
                try {
                    originalLoadFavorites();
                } catch (e) {
                    console.warn('Error en la función original de loadFavorites:', e);
                }
                
                // Llamar a la versión mejorada
                setTimeout(enhancedLoadFavorites, 100);
            };
        } else {
            // Si no existe, asignar la nuestra
            window.loadFavorites = enhancedLoadFavorites;
        }
    }
    
    // Configurar listener global para cambios en favoritos
    setupGlobalFavoritesListener();
});

/**
 * Configura el listener global para cambios en favoritos
 */
function setupGlobalFavoritesListener() {
    // Verificar si ya se configuró para evitar duplicados
    if (window._favoritesListenerConfigured) {
        return;
    }

    let debounceTimer;
    
    window.addEventListener('favoritesChanged', () => {
        // Debounce para evitar múltiples actualizaciones rápidas
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            try {
                // Actualizar recomendaciones si existe la función
                if (typeof updateRecommendations === 'function') {
                    updateRecommendations();
                }
                
                // Actualizar favoritos
                if (typeof enhancedLoadFavorites === 'function') {
                    enhancedLoadFavorites();
                }
            } catch (error) {
                console.error('Error actualizando después de cambios en favoritos:', error);
            }
        }, 1000);
    });

    // Marcar como configurado
    window._favoritesListenerConfigured = true;
}

/**
 * Función para disparar manualmente el evento de cambio en favoritos
 */
function triggerFavoritesChange() {
    const event = new CustomEvent('favoritesChanged', {
        detail: {
            timestamp: Date.now(),
            source: 'manual'
        }
    });
    
    window.dispatchEvent(event);
}

/**
 * Mejora el comportamiento de toggleFavorite para disparar el evento de cambio
 */
// Guardar la función original si existe
if (typeof window.toggleFavorite === 'function') {
    const originalToggleFavorite = window.toggleFavorite;
    
    // Reemplazar con versión mejorada
    window.toggleFavorite = function(bookId, isFavorite, iconElement) {
        // Llamar a la original
        const result = originalToggleFavorite(bookId, isFavorite, iconElement);
        
        // Disparar evento de cambio después de un tiempo para dar tiempo a que la acción complete
        setTimeout(triggerFavoritesChange, 500);
        
        return result;
    };
}