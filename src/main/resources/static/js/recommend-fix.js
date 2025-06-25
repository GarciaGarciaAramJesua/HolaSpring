/**
 * Solución para el problema de tamaño del carrusel de recomendaciones
 */
document.addEventListener('DOMContentLoaded', function() {
    // 1. Añadir estilos CSS necesarios
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        /* Ajustes para el carrusel de recomendaciones */
        #recommendations-container .swiper-container {
            height: auto;
            min-height: 380px; /* Altura mínima para mostrar cards completas */
            margin-bottom: 30px;
        }
        
        #recommendations-container .swiper-slide {
            height: auto;
            display: flex;
            justify-content: center;
        }
        
        #recommendations-container .book-card {
            height: 100%;
            width: 100%;
            max-width: 220px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
        }
        
        #recommendations-section {
            margin-bottom: 40px;
            padding: 20px 0;
        }
        
        #recommendations-container .book-cover {
            height: 220px; /* Altura fija para las portadas */
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        #recommendations-container .book-cover img {
            height: 100%;
            width: 100%;
            object-fit: cover;
        }
        
        #recommendations-container .book-info {
            padding: 15px 10px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        
        /* Ajustar navegación de Swiper */
        #recommendations-container .swiper-button-next,
        #recommendations-container .swiper-button-prev {
            color: #007bff;
            background-color: rgba(255, 255, 255, 0.8);
            width: 35px;
            height: 35px;
            border-radius: 50%;
        }
        
        #recommendations-container .swiper-button-next:after,
        #recommendations-container .swiper-button-prev:after {
            font-size: 18px;
            font-weight: bold;
        }
        
        /* Ajuste para la razón de recomendación */
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
    `;
    document.head.appendChild(styleSheet);
    
    // 2. Mejorar la función de renderizado para recomendaciones
    function enhancedRenderRecommendationsWithSwiper(books, container) {
        // Si no hay libros
        if (!books || books.length === 0) {
            container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles.</p>';
            return;
        }
        
        // Destruir Swiper previo si existe
        if (container.swiper) {
            container.swiper.destroy();
        }
        
        // Crear estructura HTML para Swiper
        const swiperHTML = `
            <div class="swiper-container book-carousel recommendations-carousel">
                <div class="swiper-wrapper">
                    ${books.map(book => `
                        <div class="swiper-slide">
                            <div class="book-card" data-book-id="${book.id}" data-book-title="${book.title}" data-book-cover-id="${book.coverId || ''}">
                                <div class="book-cover">
                                    <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
                                    <span class="favorite-icon" title="Agregar a favoritos" onclick="event.stopPropagation(); toggleFavorite('${book.id}', this.classList.contains('active'), this)">
                                        <i class="fas fa-star"></i>
                                    </span>
                                </div>
                                <div class="book-info">
                                    <h3 class="book-title">${book.title}</h3>
                                    <p class="book-author">${book.authors}</p>
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
        
        // Añadir clase especial al contenedor
        container.classList.add('recommendations-container-enhanced');
        
        // Inicializar Swiper con opciones mejoradas
        setTimeout(() => {
            try {
                container.swiper = new Swiper(container.querySelector('.swiper-container'), {
                    slidesPerView: 3,
                    spaceBetween: 30,
                    navigation: {
                        nextEl: container.querySelector('.swiper-button-next'),
                        prevEl: container.querySelector('.swiper-button-prev'),
                    },
                    autoHeight: true,
                    breakpoints: {
                        320: { slidesPerView: 1, spaceBetween: 20 },
                        576: { slidesPerView: 2, spaceBetween: 20 },
                        992: { slidesPerView: 3, spaceBetween: 30 }
                    }
                });
                
                // Forzar actualización después de cargar imágenes
                const images = container.querySelectorAll('img');
                let loadedImagesCount = 0;
                
                images.forEach(img => {
                    if (img.complete) {
                        loadedImagesCount++;
                        if (loadedImagesCount === images.length && container.swiper) {
                            container.swiper.update();
                        }
                    } else {
                        img.onload = () => {
                            loadedImagesCount++;
                            if (loadedImagesCount === images.length && container.swiper) {
                                container.swiper.update();
                            }
                        };
                        img.onerror = () => {
                            loadedImagesCount++;
                            if (loadedImagesCount === images.length && container.swiper) {
                                container.swiper.update();
                            }
                        };
                    }
                });
                
                // Hacer que las cards sean clickeables para ver detalles
                container.querySelectorAll('.book-card').forEach(card => {
                    card.addEventListener('click', (event) => {
                        // Evitar redirección si se está haciendo click en el botón de favorito
                        if (event.target.closest('.favorite-icon')) return;
                        
                        const bookId = card.getAttribute('data-book-id');
                        if (bookId) {
                            window.location.href = `/libro-detalle?id=${bookId}`;
                        }
                    });
                });
            } catch (error) {
                console.error("Error inicializando Swiper:", error);
            }
        }, 100);
        
        // Marcar favoritos activos
        checkAndMarkFavorites();
    }
    
    // 3. Verificar y marcar favoritos
    function checkAndMarkFavorites() {
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
    
    // 4. Reemplazar la función de renderizado de recomendaciones si existe
    if (typeof window.renderRecommendationsWithSwiper === 'function') {
        window.renderRecommendationsWithSwiper = enhancedRenderRecommendationsWithSwiper;
    } else {
        // Si no existe, la definimos
        window.renderRecommendationsWithSwiper = enhancedRenderRecommendationsWithSwiper;
        
        // Y actualizamos loadRecommendations si existe
        if (typeof window.loadRecommendations === 'function') {
            const originalLoadRecommendations = window.loadRecommendations;
            window.loadRecommendations = function() {
                const container = document.getElementById('recommendations-container');
                const loadingContainer = document.getElementById('loading-container');
                
                if (!container) return originalLoadRecommendations();
                
                // Mostrar carga
                if (loadingContainer) {
                    loadingContainer.style.display = 'flex';
                }
                
                // Generar y mostrar recomendaciones
                generateRecommendations(6)
                    .then(recommendations => {
                        if (loadingContainer) {
                            loadingContainer.style.display = 'none';
                        }
                        
                        enhancedRenderRecommendationsWithSwiper(recommendations, container);
                    })
                    .catch(error => {
                        console.error("Error cargando recomendaciones:", error);
                        if (loadingContainer) {
                            loadingContainer.style.display = 'none';
                        }
                        container.innerHTML = '<p class="error-message">Error al cargar recomendaciones.</p>';
                        
                        // Si falla nuestra implementación, intentar la original
                        originalLoadRecommendations();
                    });
            };
        }
    }
    
    // 5. Forzar actualización inicial si estamos en la página principal
    if (window.location.pathname === '/' || window.location.pathname === '/home' || window.location.pathname === '') {
        // Esperar un poco para asegurarse de que todo está cargado
        setTimeout(() => {
            const container = document.getElementById('recommendations-container');
            if (container) {
                if (typeof window.loadRecommendations === 'function') {
                    window.loadRecommendations();
                }
            }
        }, 500);
    }
});