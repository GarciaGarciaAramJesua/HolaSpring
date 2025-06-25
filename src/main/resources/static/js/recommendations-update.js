/**
 * Solución para actualizar recomendaciones cuando cambian favoritos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Sobrescribir la función toggle para forzar actualización de recomendaciones
    const originalToggleFavorite = window.toggleFavorite;
    
    if (typeof originalToggleFavorite === 'function') {
        window.toggleFavorite = function(bookId, isFavorite, iconElement) {
            // Llamar a la función original
            const result = originalToggleFavorite(bookId, isFavorite, iconElement);
            
            // Limpiar caché de recomendaciones de forma forzada
            console.log("Forzando actualización de recomendaciones después de cambio en favoritos");
            
            // Asegurar que el objeto _recEngine existe
            if (!window._recEngine) {
                window._recEngine = {
                    cachedRecommendations: null,
                    lastUpdateTimestamp: null,
                    userPreferences: null
                };
            }
            
            // Forzar limpieza de caché
            window._recEngine.cachedRecommendations = null;
            window._recEngine.lastUpdateTimestamp = null;
            window._recEngine.userPreferences = null;
            
            // Programar una actualización después de que la API ha terminado
            setTimeout(() => {
                if (typeof loadRecommendations === 'function') {
                    console.log("Recargando recomendaciones...");
                    loadRecommendations();
                } else if (typeof _enhancedLoadRecommendations === 'function') {
                    _enhancedLoadRecommendations();
                } else if (typeof updateRecommendations === 'function') {
                    updateRecommendations();
                }
            }, 1000);
            
            return result;
        };
    }
    
    // Reducir el tiempo de caché de recomendaciones a 2 minutos en lugar de 1 hora
    const originalGenerateRecommendations = window.generateRecommendations;
    
    if (typeof originalGenerateRecommendations === 'function') {
        window.generateRecommendations = async function(limit = 15) {
            // Si tenemos función original
            try {
                // Comprobar caché con tiempo reducido (2 minutos = 120000 ms)
                if (window._recEngine && 
                    window._recEngine.cachedRecommendations && 
                    window._recEngine.lastUpdateTimestamp && 
                    Date.now() - window._recEngine.lastUpdateTimestamp < 120000) {
                    console.log("Usando recomendaciones en caché (menos de 2 minutos)");
                    return window._recEngine.cachedRecommendations.slice(0, limit);
                }
                
                console.log("Generando nuevas recomendaciones, caché expirada o limpiada");
                
                // Llamar a la implementación original para generar nuevas
                const recommendations = await originalGenerateRecommendations(limit);
                
                // Actualizar la caché
                if (window._recEngine) {
                    window._recEngine.cachedRecommendations = recommendations;
                    window._recEngine.lastUpdateTimestamp = Date.now();
                }
                
                return recommendations;
            } catch (error) {
                console.error("Error en generateRecommendations:", error);
                // Llamar a la original como fallback
                return await originalGenerateRecommendations(limit);
            }
        };
    }
    
    // Mejorar el evento favoritesChanged para que siempre actualice
    window.triggerFavoritesChange = function() {
        console.log("Evento favoritesChanged disparado");
        // Limpiar caché explícitamente
        if (window._recEngine) {
            window._recEngine.cachedRecommendations = null;
            window._recEngine.lastUpdateTimestamp = null;
        }
        
        // Crear y disparar evento
        const event = new CustomEvent('favoritesChanged', {
            detail: {
                timestamp: Date.now(),
                source: 'manual',
                forceUpdate: true
            }
        });
        
        window.dispatchEvent(event);
    };
});

// Registrar un nuevo listener para el evento favoritesChanged
window.addEventListener('favoritesChanged', function(event) {
    console.log("Evento favoritesChanged recibido", event.detail);
    
    // Si venimos de una actualización manual o si se solicita forzar actualización
    if (event.detail.source === 'manual' || event.detail.forceUpdate) {
        // Programar actualización
        setTimeout(() => {
            if (typeof loadRecommendations === 'function') {
                console.log("Recargando recomendaciones desde evento...");
                loadRecommendations();
            }
        }, 500);
    }
});