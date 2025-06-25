/**
 * Solución definitiva para el carrusel de recomendaciones
 * - Corrige problemas de tamaño entre contenedores
 * - Asegura que se muestren múltiples tarjetas
 * - Elimina conflictos de estilos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Función para mostrar dimensiones para diagnóstico
    function logElementDimensions(selector, message = "") {
        const element = document.querySelector(selector);
        if (!element) return;
        
        const styles = window.getComputedStyle(element);
        console.log(`${message || selector} dimensiones:`, {
            width: styles.width,
            height: styles.height,
            maxWidth: styles.maxWidth,
            display: styles.display,
            position: styles.position,
            padding: styles.padding
        });
    }
    
    // 1. SOLUCIÓN: Reset completo de estilos críticos
    const fixStyles = document.createElement('style');
    fixStyles.innerHTML = `
        /* RESET CRÍTICO: Asegurar dimensiones correctas */
        #recommendations-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 15px !important;
            display: block !important;
            overflow: hidden !important;
            position: relative !important;
        }
        
        /* Contenedor del carrusel */
        #recommendations-container .swiper-container {
            width: 100% !important;
            height: auto !important;
            min-height: 400px !important;
            overflow: hidden !important;
            margin: 20px 0 40px 0 !important;
            position: relative !important; /* Para botones de navegación */
        }
        }
        
        /* Wrapper de slides */
        #recommendations-container .swiper-wrapper {
            display: flex !important;
            width: 100% !important;
            height: auto !important;
            padding: 10px 0 !important; /* Espacio para sombras */
            margin: 0 auto !important;
        }
        
        /* Cada slide individual */
        #recommendations-container .swiper-slide {
            width: calc(33.333% - 20px) !important;
            height: auto !important;
            min-height: 380px !important;
            flex-shrink: 0 !important;
            padding: 0 !important;
        }
        
        /* Tarjeta de libro dentro del slide */
        #recommendations-container .book-card {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: var(--card-bg);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        
        #recommendations-container .book-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        /* Portada del libro */
        #recommendations-container .book-cover {
            height: 270px !important;
            position: relative !important;
            overflow: hidden !important;
            border-radius: 8px 8px 0 0;
        }
        
        #recommendations-container .book-cover img {
            width: 100% !important;
            height: 100% !important;
            /*object-fit: cover !important;*/
        }
        
        /* Info del libro */
        #recommendations-container .book-info {
            padding: 40px !important;
            /*flex-grow: 1 !important;*/
            display: flex !important;
            flex-direction: column !important;
        }
        
        /* Navegación del carrusel */
        #recommendations-container .swiper-button-next,
        #recommendations-container .swiper-button-prev {
            color: #007bff !important;
            width: 40px !important;
            height: 40px !important;
            background-color: white !important;
            border-radius: 50% !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
            top: 50% !important; /* Centrar verticalmente */
            transform: translateY(-50%) !important;
            margin-top: 0 !important; /* Anular margen predeterminado de Swiper */
            z-index: 10 !important;
            position: absolute !important;
        }
        
        /* Posicionar botones correctamente dentro del carrusel */
        #recommendations-container .swiper-button-prev {
            left: 10px !important; /* Dentro del contenedor con margen */
        }
        
        #recommendations-container .swiper-button-next {
            right: 10px !important; /* Dentro del contenedor con margen */
        }

        #recommendations-container .swiper-button-next:after,
        #recommendations-container .swiper-button-prev:after {
            font-size: 18px !important;
            font-weight: bold !important;
        }
        
        /* Título de sección */
        #recommendations-section h2 {
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
            border-bottom: 2px solid #f0f0f0 !important;
        }
        
        /* Media queries para responsividad */
        @media (max-width: 992px) {
            #recommendations-container .swiper-slide {
                width: calc(50% - 15px) !important;
            }
        }
        
        @media (max-width: 576px) {
            #recommendations-container .swiper-slide {
                width: 100% !important;
            }

            /* Ajustar botones en móviles */
            #recommendations-container .swiper-button-next,
            #recommendations-container .swiper-button-prev {
                width: 32px !important;
                height: 32px !important;
            }
            
            #recommendations-container .swiper-button-next:after,
            #recommendations-container .swiper-button-prev:after {
                font-size: 14px !important;
            }
        }
    `;
    document.head.appendChild(fixStyles);
    
    // 2. FUNCIÓN MEJORADA: Renderizado e inicialización de Swiper
    function fixedRenderRecommendationCarousel(books, container) {
        // Si no hay libros, mostrar mensaje
        if (!books || books.length === 0) {
            container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles.</p>';
            return;
        }
        
        // Limpiar completamente el contenedor
        container.innerHTML = '';
        
        // Crear nuevo contenedor Swiper desde cero
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'swiper-container recommendations-swiper';
        container.appendChild(swiperContainer);
        
        // Crear wrapper para slides
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        swiperContainer.appendChild(swiperWrapper);
        
        // Crear slides para cada libro
        books.forEach(book => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            slide.innerHTML = `
                <div class="book-card" data-book-id="${book.id}" data-book-title="${book.title}" data-book-cover-id="${book.coverId || ''}">
                    <div class="book-cover">
                        <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='/images/default-cover.jpg'">
                        <span class="favorite-icon${book.isFavorite ? ' active' : ''}" 
                              title="${book.isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}" 
                              onclick="event.stopPropagation(); toggleFavorite('${book.id}', ${book.isFavorite || false}, this)">
                            <i class="fas fa-star"></i>
                        </span>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${book.authors}</p>
                        ${book.reason ? `<div class="recommendation-reason-badge"><i class="fas fa-info-circle"></i><span>${book.reason}</span></div>` : ''}
                    </div>
                </div>
            `;
            
            swiperWrapper.appendChild(slide);
        });
        
        // Agregar botones de navegación
        const prevButton = document.createElement('div');
        prevButton.className = 'swiper-button-prev';
        swiperContainer.appendChild(prevButton);
        
        const nextButton = document.createElement('div');
        nextButton.className = 'swiper-button-next';
        swiperContainer.appendChild(nextButton);
        
        console.log("Contenedor preparado para Swiper:", container);
        
        // Agregar clase para nuestros estilos específicos
        container.classList.add('recommendations-fixed-container');
        
        // Verificar que las dimensiones son correctas antes de inicializar Swiper
        logElementDimensions('#recommendations-container', "Contenedor recomendaciones");
        
        // Destruir instancia previa de Swiper si existe
        if (window.recommendationsSwiper) {
            window.recommendationsSwiper.destroy(true, true);
        }
        
        // Esperar a que el DOM se actualice antes de inicializar Swiper
        setTimeout(() => {
            try {
                // Inicializar Swiper con opciones específicas
                window.recommendationsSwiper = new Swiper(swiperContainer, {
                    slidesPerView: 'auto',  // Importante: usar 'auto' para respetar los anchos CSS
                    spaceBetween: 20,
                    observer: true,        // Reaccionar a cambios en el DOM
                    observeParents: true,  // Observar cambios en padres
                    resizeObserver: true,  // Reaccionar a cambios de tamaño
                    updateOnWindowResize: true,
                    watchOverflow: true,
                    navigation: {
                        nextEl: nextButton,
                        prevEl: prevButton,
                    },
                    breakpoints: {
                        0: {
                            slidesPerView: 1,
                            spaceBetween: 10
                        },
                        576: {
                            slidesPerView: 2,
                            spaceBetween: 15
                        },
                        992: {
                            slidesPerView: 3,
                            spaceBetween: 20
                        }
                    }
                });
                
                console.log("Swiper inicializado correctamente:", window.recommendationsSwiper);
                
                // Forzar actualización después de que las imágenes carguen
                const images = container.querySelectorAll('img');
                let loadedCount = 0;
                
                const updateSwiperAfterImagesLoad = () => {
                    loadedCount++;
                    if (loadedCount >= images.length && window.recommendationsSwiper) {
                        console.log("Todas las imágenes cargadas, actualizando Swiper");
                        window.recommendationsSwiper.update();
                    }
                };
                
                images.forEach(img => {
                    if (img.complete) {
                        updateSwiperAfterImagesLoad();
                    } else {
                        img.onload = updateSwiperAfterImagesLoad;
                        img.onerror = updateSwiperAfterImagesLoad;
                    }
                });
                
                // Hacer las tarjetas clickeables
                container.querySelectorAll('.book-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('.favorite-icon')) return;
                        
                        const bookId = card.dataset.bookId;
                        if (bookId) {
                            window.location.href = `/libro-detalle?id=${bookId}`;
                        }
                    });
                });
                
            } catch (error) {
                console.error("Error inicializando Swiper:", error);
            }
        }, 300); // Esperar 300ms para asegurar que el DOM está listo
        
        // Verificar y marcar favoritos
        markFavoritesInContainer(container);
    }
    
    // 3. Función para marcar favoritos
    function markFavoritesInContainer(container) {
        fetch('/api/favorites', {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const favorites = data.favorites || [];
            const favoriteIds = favorites.map(fav => fav.bookId);
            
            container.querySelectorAll('.book-card').forEach(card => {
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
    
    // 4. Reemplazar funciones de recomendaciones
    // Definir nuestra función mejorada de carga de recomendaciones
    function fixedLoadRecommendations() {
        const container = document.getElementById('recommendations-container');
        const loadingElement = document.getElementById('loading-container');
        
        if (!container) return;
        
        // Mostrar carga
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // Generar recomendaciones
        generateRecommendations(12)
            .then(recommendations => {
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                // Obtener IDs de favoritos para marcarlos
                return fetch('/api/favorites', {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(res => res.json())
                .then(data => {
                    const favoriteIds = (data.favorites || []).map(fav => fav.bookId);
                    
                    // Añadir propiedad isFavorite a cada recomendación
                    recommendations.forEach(book => {
                        book.isFavorite = favoriteIds.includes(book.id);
                    });
                    
                    // Renderizar con nuestro carrusel mejorado
                    fixedRenderRecommendationCarousel(recommendations, container);
                });
            })
            .catch(error => {
                console.error("Error cargando recomendaciones:", error);
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                container.innerHTML = '<p class="error-message">Error al cargar recomendaciones.</p>';
            });
    }
    
    // 5. Implementar nuestra función de recomendaciones
    // Reemplazar las funciones existentes con nuestras versiones fijas
    window.renderRecommendationsWithSwiper = fixedRenderRecommendationCarousel;
    window.loadRecommendations = fixedLoadRecommendations;
    
    // Asegurar que se actualice cuando se añaden favoritos
    const originalToggleFavorite = window.toggleFavorite;
    if (typeof originalToggleFavorite === 'function') {
        window.toggleFavorite = function(bookId, isFavorite, iconElement) {
            const result = originalToggleFavorite(bookId, isFavorite, iconElement);
            
            setTimeout(fixedLoadRecommendations, 1000);
            
            return result;
        };
    }
    
    // 6. Ejecutar nuestra versión mejorada cuando la página esté lista
    // Iniciar carga de recomendaciones después de pequeño delay
    setTimeout(fixedLoadRecommendations, 500);
    
    // Verificar que todo funciona un par de segundos después (self-healing)
    setTimeout(() => {
        const container = document.getElementById('recommendations-container');
        const slides = container?.querySelectorAll('.swiper-slide');
        
        if (container && (!slides || slides.length === 0)) {
            console.warn("Auto-reparación: No se detectaron slides, recargando recomendaciones");
            fixedLoadRecommendations();
        }
    }, 3000);
});