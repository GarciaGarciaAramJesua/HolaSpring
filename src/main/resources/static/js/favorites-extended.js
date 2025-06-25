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

/**
 * Corrección para incluir autores en favoritos
 */
document.addEventListener('DOMContentLoaded', function() {
    const originalToggleFavorite = window.toggleFavorite;
    
    if (typeof originalToggleFavorite === 'function') {
        window.toggleFavorite = function(bookId, isFavorite, iconElement) {
            const method = isFavorite ? "DELETE" : "POST";
            
            // Solo necesitamos los datos para POST (añadir favorito)
            if (method === "POST") {
                // Obtener elemento del libro
                const bookCard = findBookElement(bookId, iconElement);
                
                // Extraer datos necesarios
                let bookTitle = "Título desconocido";
                let bookCoverId = null;
                let bookAuthors = "Autor desconocido";
                
                if (bookCard) {
                    // Extraer título
                    bookTitle = extractBookTitle(bookCard);
                    
                    // Extraer ID de portada
                    bookCoverId = extractCoverIdFromElement(bookCard);
                    
                    // NUEVO: Extraer autores
                    bookAuthors = extractBookAuthors(bookCard);
                }
                
                // Buscar en colecciones globales si no encontramos datos en el DOM
                if (bookTitle === "Título desconocido" || bookAuthors === "Autor desconocido" || bookCoverId === null) {
                    const bookData = findBookInCollections(bookId);
                    if (bookData) {
                        if (bookTitle === "Título desconocido" && bookData.title) {
                            bookTitle = bookData.title;
                        }
                        if (bookCoverId === null && bookData.coverId) {
                            bookCoverId = bookData.coverId;
                        }
                        // NUEVO: Usar autores de colecciones
                        if (bookAuthors === "Autor desconocido" && bookData.authors) {
                            bookAuthors = bookData.authors;
                        }
                    }
                }
                
                console.log(`Toggle favorito: ${bookId}, título: ${bookTitle}, autor: ${bookAuthors}, coverID: ${bookCoverId}`);
                
                // Configurar opciones para la solicitud
                const requestOptions = {
                    method: method,
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('token')}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        bookId: bookId,
                        bookTitle: bookTitle,
                        bookCoverId: bookCoverId,
                        authors: bookAuthors  // NUEVO: Incluir autores
                    })
                };
                
                // Enviar solicitud
                return fetch(`/api/favorites/${bookId}`, requestOptions)
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => {
                                throw new Error(err.error || `Error ${response.status}`);
                            }).catch(e => {
                                throw new Error(`Error ${response.status}: ${response.statusText}`);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Actualizar UI
                        if (iconElement) iconElement.classList.toggle('active', !isFavorite);
                        showNotification("Agregado a favoritos", 2000);
                        
                        // Recargar favoritos y notificar cambio
                        if (typeof loadFavorites === 'function') loadFavorites();
                        if (typeof triggerFavoritesChange === 'function') triggerFavoritesChange();
                        
                        return data;
                    })
                    .catch(error => {
                        console.error('Error en toggleFavorite:', error);
                        showNotification("No se pudo actualizar el favorito: " + error.message, 3000);
                        throw error;
                    });
            } else {
                // Para DELETE simplemente llamar a la función original
                return originalToggleFavorite(bookId, isFavorite, iconElement);
            }
        };
    }
    
    // NUEVA función para extraer autores
    window.extractBookAuthors = function(element) {
        // Buscar la información de autores
        const authorSelectors = [
            'p.book-author', '.book-author', '.author', 
            '[data-book-author]', '[data-author]'
        ];
        
        for (const selector of authorSelectors) {
            const authorElement = element.querySelector(selector);
            if (authorElement && authorElement.textContent.trim()) {
                return authorElement.textContent.trim();
            }
        }
        
        // Verificar si existe un texto que podría ser el autor (segundo párrafo en .book-info)
        const bookInfo = element.querySelector('.book-info');
        if (bookInfo) {
            const paragraphs = bookInfo.querySelectorAll('p');
            if (paragraphs.length > 0) {
                // Generalmente el autor está en el primer o segundo párrafo
                return paragraphs[0].textContent.trim();
            }
        }
        
        // Verificar atributos de datos
        if (element.dataset.bookAuthor) {
            return element.dataset.bookAuthor;
        }
        
        return "Autor desconocido";
    };
});

/**
 * Corrección para el renderizado de favoritos
 */
document.addEventListener('DOMContentLoaded', function() {
    // Función para renderizar un libro con todos los datos
    function renderFavoritesWithAuthors(books) {
        const container = document.getElementById('favorites-books-container');
        if (!container) return;
        
        if (!books || books.length === 0) {
            container.innerHTML = `
                <div class="no-favorites">
                    <i class="far fa-heart"></i>
                    <p>No tienes libros favoritos.</p>
                    <p class="sub-message">Explora y marca libros como favoritos para verlos aquí.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = books.map(book => `
            <div class="book-card" data-book-id="${book.bookId || book.id}" onclick="window.location.href='/libro-detalle?id=${book.bookId || book.id}'">
                <div class="book-cover">
                    <img src="${book.coverUrl}" alt="${book.bookTitle || book.title}" onerror="this.src='${DEFAULT_COVER}'">
                    <span class="favorite-icon active" title="Eliminar de favoritos" 
                          onclick="event.stopPropagation(); toggleFavorite('${book.bookId || book.id}', true, this)">
                        <i class="fas fa-star"></i>
                    </span>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.bookTitle || book.title || 'Título desconocido'}</h3>
                    <p class="book-author">${book.authors || 'Autor desconocido'}</p>
                </div>
            </div>
        `).join('');
        
        console.log("Libros favoritos renderizados:", books);
    }
    
    // Reemplazar la función de renderizado de favoritos si existe
    const originalRenderFavorites = window.renderFavorites;
    
    if (typeof originalRenderFavorites === 'function') {
        window.renderFavorites = function(books) {
            // Imprimir los datos para depuración
            console.log("Datos de favoritos a renderizar:", books);
            
            // Usar nuestra versión mejorada
            renderFavoritesWithAuthors(books);
        };
    } else {
        window.renderFavorites = renderFavoritesWithAuthors;
    }
    
    // También mejoramos loadFavorites para mostrar datos como llegan
    const originalLoadFavorites = window.loadFavorites;
    
    if (typeof originalLoadFavorites === 'function') {
        window.loadFavorites = function() {
            fetch('/api/favorites', {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(res => res.json())
            .then(data => {
                // Mostrar los datos originales
                console.log("Datos originales de favoritos:", data);
                
                // Continuar con la función original
                originalLoadFavorites();
            })
            .catch(err => console.error("Error en loadFavorites mejorado:", err));
        };
    }
});