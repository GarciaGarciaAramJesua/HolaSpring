/**
 * Funciones mejoradas para manejar recomendaciones de libros
 */

// Cache para almacenar recomendaciones
let cachedRecommendations = null;
let lastUpdateTimestamp = null;
let userPreferences = null;

/**
 * Versión mejorada de loadRecommendations
 * Se integra con la implementación existente
 */
function loadRecommendations() {
    // Verificar si estamos extendiendo la función existente
    if (window._originalLoadRecommendations) {
        // No volver a definir si ya hemos guardado la versión original
        return _enhancedLoadRecommendations();
    }
    
    // Guardar la versión original si existe
    if (typeof window.loadRecommendations === 'function') {
        window._originalLoadRecommendations = window.loadRecommendations;
    }
    
    // Redefinir con la versión mejorada
    return _enhancedLoadRecommendations();
}

/**
 * Implementación mejorada de carga de recomendaciones
 */
async function _enhancedLoadRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const loadingContainer = document.getElementById('loading-container');
    
    try {
        // Mostrar loading
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
        
        // Generar recomendaciones personalizadas
        const recommendations = await generateRecommendations(6); // Limitamos a 6 para la vista principal
        
        // Ocultar loading
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
        if (!recommendations.length) {
            container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles. Añade algunos favoritos para recibir recomendaciones personalizadas.</p>';
            return;
        }
        
        // Renderizar las recomendaciones usando la función existente
        renderBooksWithoutSwiper(recommendations, container);
        
        // Añadir insignias de recomendación
        setTimeout(() => {
            addRecommendationBadges(container, recommendations);
        }, 200);
        
    } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        container.innerHTML = '<p class="error-message">No se pudieron cargar las recomendaciones. Intente nuevamente.</p>';
    }
}

/**
 * Añade badges de recomendación a las tarjetas
 */
function addRecommendationBadges(container, recommendations) {
    const bookCards = container.querySelectorAll('.book-card');
    
    bookCards.forEach((card, index) => {
        if (recommendations[index] && recommendations[index].reason) {
            // Crear badge de razón
            const reasonBadge = document.createElement('div');
            reasonBadge.className = 'recommendation-reason-badge';
            reasonBadge.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${recommendations[index].reason}</span>
            `;
            
            // Insertar badge en la tarjeta (asegurándonos de que se adapta a tu estructura HTML existente)
            const cardContent = card.querySelector('.book-info');
            if (cardContent) {
                cardContent.appendChild(reasonBadge);
            }

            // Añadir clase especial para recomendaciones
            card.classList.add('recommendation-enhanced');
        }
    });
}

// Añadir CSS dinámicamente para los badges de recomendación
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .recommendation-reason-badge {
            background-color: rgba(0, 123, 255, 0.1);
            border-left: 3px solid #007bff;
            color: #333;
            font-size: 12px;
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 0 4px 4px 0;
            display: flex;
            align-items: center;
        }
        
        .recommendation-reason-badge i {
            margin-right: 5px;
            color: #007bff;
        }
        
        .recommendation-enhanced {
            position: relative;
        }
        
        .recommendation-enhanced::after {
            content: "Recomendado";
            position: absolute;
            top: 10px;
            right: -5px;
            background-color: #007bff;
            color: white;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 3px;
            transform: rotate(45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
});

/**
 * Función para actualizar recomendaciones manualmente
 */
function updateRecommendations() {
    clearRecommendationsCache();
    return _enhancedLoadRecommendations();
}

/**
 * Limpia la caché de recomendaciones
 */
function clearRecommendationsCache() {
    _recEngine.cachedRecommendations = null;
    _recEngine.lastUpdateTimestamp = null;
    _recEngine.userPreferences = null;
}