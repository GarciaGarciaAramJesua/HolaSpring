/**
 * Mejoras para el sistema de recomendaciones
 * - Actualización en tiempo real sin recargar
 * - Uso del mismo carrusel que las categorías
 */
document.addEventListener('DOMContentLoaded', function() {
    // 1. SOLUCIÓN PARA ACTUALIZACIÓN EN TIEMPO REAL
    
    // Forzar la actualización de la vista sin recargar
    function forceRefreshRecommendations() {
        console.log("Actualizando recomendaciones en tiempo real...");
        
        // Limpiar la caché de recomendaciones
        if (window._recEngine) {
            window._recEngine.cachedRecommendations = null;
            window._recEngine.lastUpdateTimestamp = null;
        }
        
        // Obtener nuevas recomendaciones
        generateRecommendations(6).then(recommendations => {
            console.log("Nuevas recomendaciones generadas:", recommendations.length);
            
            // Obtener el contenedor
            const container = document.getElementById('recommendations-container');
            if (!container) return;
            
            // Renderizar las recomendaciones usando el carrusel de Swiper como en categorías
            renderRecommendationsWithSwiper(recommendations, container);
        }).catch(error => {
            console.error("Error actualizando recomendaciones:", error);
        });
    }
    
    // 2. SOLUCIÓN PARA USAR EL MISMO CARRUSEL QUE CATEGORÍAS
    
    // Función para renderizar con Swiper
    function renderRecommendationsWithSwiper(books, container) {
        // Si no hay libros
        if (!books || books.length === 0) {
            container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles.</p>';
            return;
        }
        
        // Destruir Swiper previo si existe (adaptado de books.js)
        if (container.swiper) {
            container.swiper.destroy();
        }
        
        // Crear estructura HTML para Swiper como en renderBooks original
        const swiperHTML = `
            <div class="swiper-container book-carousel recommendations-carousel">
                <div class="swiper-wrapper">
                    ${books.map(book => `
                        <div class="swiper-slide">
                            <div class="book-card" data-book-id="${book.id}" data-book-title="${book.title}" data-book-cover-id="${book.coverId || ''}">
                                <div class="book-cover">
                                    <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
                                    <span class="favorite-icon" title="Agregar a favoritos" onclick="event.stopPropagation(); toggleFavorite('${book.id}', this.classList.contains('active'))">
                                        <i class="fas fa-star"></i>
                                    </span>
                                </div>
                                <div class="book-info">
                                    <h3>${book.title}</h3>
                                    <p>${book.authors}</p>
                                    ${book.reason ? `<div class="recommendation-reason-badge"><i class="fas fa-info-circle"></i><span>${book.reason}</span></div>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        `;
        
        // Limpiar el contenedor y añadir el HTML
        container.innerHTML = swiperHTML;
        
        // Inicializar Swiper como en la función original renderBooks
        container.swiper = new Swiper(container.querySelector('.swiper-container'), {
            slidesPerView: 3,
            spaceBetween: 20,
            navigation: {
                nextEl: container.querySelector('.swiper-button-next'),
                prevEl: container.querySelector('.swiper-button-prev'),
            },
            breakpoints: {
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }
        });
        
        // Marcar favoritos activos
        checkAndMarkFavorites();
    }
    
    // Verificar y marcar favoritos en el carrusel
    function checkAndMarkFavorites() {
        // Obtener IDs de favoritos actuales
        fetch('/api/favorites', {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const favorites = data.favorites || [];
            const favoriteIds = favorites.map(fav => fav.bookId);
            
            // Marcar iconos de favoritos
            document.querySelectorAll('.book-card').forEach(card => {
                const bookId = card.dataset.bookId;
                if (bookId) {
                    const isFavorite = favoriteIds.includes(bookId);
                    const icon = card.querySelector('.favorite-icon');
                    if (icon) {
                        icon.classList.toggle('active', isFavorite);
                    }
                }
            });
        })
        .catch(err => console.error("Error verificando favoritos:", err));
    }
    
    // Sobrescribir generateRecommendations para mezclar uniformemente
    const originalGenerateRecommendations = window.generateRecommendations;
    if (typeof originalGenerateRecommendations === 'function') {
        window.generateRecommendations = async function(limit = 15) {
            const recommendations = await originalGenerateRecommendations(limit);
            
            // Mezclar uniformemente las recomendaciones
            return shuffleRecommendations(recommendations);
        };
    }
    
    // Función para mezclar las recomendaciones de manera uniforme
    function shuffleRecommendations(recommendations) {
        if (!recommendations || recommendations.length <= 1) return recommendations;
        
        // Agrupar por razón de recomendación
        const groupedRecs = {};
        
        recommendations.forEach(rec => {
            const reason = rec.reason || 'general';
            if (!groupedRecs[reason]) {
                groupedRecs[reason] = [];
            }
            groupedRecs[reason].push(rec);
        });
        
        // Mezclar cada grupo
        Object.keys(groupedRecs).forEach(reason => {
            groupedRecs[reason] = shuffle(groupedRecs[reason]);
        });
        
        // Mezclar uniformemente tomando uno de cada grupo en rotación
        const result = [];
        const groups = Object.values(groupedRecs);
        let allEmpty = false;
        
        while (!allEmpty) {
            allEmpty = true;
            for (const group of groups) {
                if (group.length > 0) {
                    result.push(group.shift());
                    allEmpty = false;
                }
            }
        }
        
        return result;
    }
    
    // Función para mezclar un array (Fisher-Yates shuffle)
    function shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    
    // Reemplazar la función loadRecommendations para usar nuestro método mejorado
    window.loadRecommendations = function() {
        const container = document.getElementById('recommendations-container');
        const loadingContainer = document.getElementById('loading-container');
        
        if (!container) return;
        
        // Mostrar carga si existe el elemento
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
        
        // Generar y mostrar recomendaciones
        generateRecommendations(6)
            .then(recommendations => {
                if (loadingContainer) {
                    loadingContainer.style.display = 'none';
                }
                
                renderRecommendationsWithSwiper(recommendations, container);
            })
            .catch(error => {
                console.error("Error cargando recomendaciones:", error);
                if (loadingContainer) {
                    loadingContainer.style.display = 'none';
                }
                container.innerHTML = '<p class="error-message">Error al cargar recomendaciones.</p>';
            });
    };
    
    // Sobrescribir toggleFavorite para actualizar recomendaciones en tiempo real
    const originalToggleFavorite = window.toggleFavorite;
    if (typeof originalToggleFavorite === 'function') {
        window.toggleFavorite = function(bookId, isFavorite, iconElement) {
            // Llamar a función original
            const result = originalToggleFavorite(bookId, isFavorite, iconElement);
            
            // Después de un corto tiempo, actualizar recomendaciones sin recargar
            setTimeout(forceRefreshRecommendations, 1000);
            
            return result;
        };
    }
    
    // También conectamos al evento favoritesChanged
    window.addEventListener('favoritesChanged', function() {
        setTimeout(forceRefreshRecommendations, 1000);
    });
});

