/**
 * Sistema unificado de gestión de favoritos
 * Combina funcionalidad de toggle, carga y renderizado de favoritos
 * Compatible con Spring Boot + JWT
 */

// Constantes de configuración
const FAVORITES_CONFIG = {
    API_BASE: '/api/favorites',
    DEFAULT_COVER: '/images/default-cover.jpg', // Ajustar según tu proyecto
    NOTIFICATION_DURATION: 2000,
    ERROR_NOTIFICATION_DURATION: 3000,
    DEBOUNCE_DELAY: 500
};

// Variables globales para evitar múltiples configuraciones
let _favoritesListenerConfigured = false;
let _debounceTimer = null;

/**
 * Función principal para marcar/desmarcar favoritos
 * Maneja tanto POST (agregar) como DELETE (eliminar)
 */
function toggleFavorite(bookId, isFavorite, iconElement) {
    const method = isFavorite ? "DELETE" : "POST";
    
    // Configuración base de la petición
    const requestOptions = {
        method: method,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
        }
    };
    
    // Para POST necesitamos enviar datos del libro
    if (method === "POST") {
        const bookData = extractBookData(bookId, iconElement);
        requestOptions.body = JSON.stringify({
            bookId: bookId,
            bookTitle: bookData.title,
            bookCoverId: bookData.coverId,
            authors: bookData.authors
        });
        
        console.log(`Agregando favorito: ${bookId}`, bookData);
    } else {
        console.log(`Eliminando favorito: ${bookId}`);
    }
    
    // Realizar petición HTTP
    return fetch(`${FAVORITES_CONFIG.API_BASE}/${bookId}`, requestOptions)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `Error ${response.status}: ${response.statusText}`);
                }).catch(() => {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Actualizar interfaz
            if (iconElement) {
                iconElement.classList.toggle('active', !isFavorite);
            }
            
            // Mostrar notificación
            const message = isFavorite ? "Eliminado de favoritos" : "Agregado a favoritos";
            showNotification(message, FAVORITES_CONFIG.NOTIFICATION_DURATION);
            
            // Actualizar listas y recomendaciones
            setTimeout(() => {
                loadFavorites();
                triggerFavoritesChange();
            }, FAVORITES_CONFIG.DEBOUNCE_DELAY);
            
            return data;
        })
        .catch(error => {
            console.error('Error en toggleFavorite:', error);
            showNotification("No se pudo actualizar el favorito: " + error.message, 
                           FAVORITES_CONFIG.ERROR_NOTIFICATION_DURATION);
            throw error;
        });
}

/**
 * Extrae datos completos del libro desde el DOM o colecciones en memoria
 */
function extractBookData(bookId, iconElement) {
    let bookData = {
        title: "Título desconocido",
        authors: "Autor desconocido",
        coverId: null
    };
    
    // Buscar elemento del libro en el DOM
    const bookElement = findBookElement(bookId, iconElement);
    
    if (bookElement) {
        bookData.title = extractBookTitle(bookElement);
        bookData.authors = extractBookAuthors(bookElement);
        bookData.coverId = extractCoverIdFromElement(bookElement);
    }
    
    // Si no encontramos datos suficientes, buscar en colecciones globales
    if (bookData.title === "Título desconocido" || 
        bookData.authors === "Autor desconocido" || 
        bookData.coverId === null) {
        
        const globalBookData = findBookInCollections(bookId);
        if (globalBookData) {
            if (bookData.title === "Título desconocido" && globalBookData.title) {
                bookData.title = globalBookData.title;
            }
            if (bookData.authors === "Autor desconocido" && globalBookData.authors) {
                bookData.authors = globalBookData.authors;
            }
            if (bookData.coverId === null && globalBookData.coverId) {
                bookData.coverId = globalBookData.coverId;
            }
        }
    }
    
    return bookData;
}

/**
 * Encuentra el elemento del libro en el DOM usando múltiples estrategias
 */
function findBookElement(bookId, iconElement) {
    // Estrategia 1: Desde el ícono hacia arriba
    if (iconElement) {
        const card = iconElement.closest('.book-card, .favorite-card, .book-item');
        if (card) return card;
    }
    
    // Estrategia 2: Por atributo data-book-id
    const cardWithDataAttr = document.querySelector(`[data-book-id="${bookId}"]`);
    if (cardWithDataAttr) return cardWithDataAttr;
    
    // Estrategia 3: Buscar en elementos que contengan el ID
    const allBookElements = document.querySelectorAll('.book-card, .book-item, .favorite-card');
    for (const element of allBookElements) {
        const links = element.querySelectorAll(`a[href*="${bookId}"], [onclick*="${bookId}"]`);
        if (links.length > 0) return element;
    }
    
    return null;
}

/**
 * Extrae el título del libro desde el elemento DOM
 */
function extractBookTitle(element) {
    const titleSelectors = [
        'h3', 'h4', '.book-title', '.favorite-card-title', 
        '[data-book-title]', '.title'
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = element.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
            return titleElement.textContent.trim();
        }
    }
    
    return element.dataset.bookTitle || "Título desconocido";
}

/**
 * Extrae los autores del libro desde el elemento DOM
 */
function extractBookAuthors(element) {
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
    
    // Buscar en párrafos de información del libro
    const bookInfo = element.querySelector('.book-info');
    if (bookInfo) {
        const paragraphs = bookInfo.querySelectorAll('p');
        if (paragraphs.length > 0) {
            return paragraphs[0].textContent.trim();
        }
    }
    
    return element.dataset.bookAuthor || "Autor desconocido";
}

/**
 * Extrae el ID de la portada desde imágenes o atributos
 */
function extractCoverIdFromElement(element) {
    if (element.dataset.bookCoverId) {
        return element.dataset.bookCoverId;
    }
    
    const img = element.querySelector('img');
    if (img && img.src) {
        // Patrón para OpenLibrary covers
        const idMatch = img.src.match(/\/id\/(\d+)/);
        if (idMatch && idMatch[1]) return idMatch[1];
        
        const olidMatch = img.src.match(/\/olid\/([A-Za-z0-9]+)/);
        if (olidMatch && olidMatch[1]) return olidMatch[1];
    }
    
    return null;
}

/**
 * Busca datos del libro en colecciones globales en memoria
 */
function findBookInCollections(bookId) {
    const possibleCollections = [
        window._recEngine?.cachedRecommendations,
        window._lastSearchResults,
        window._cachedBooks,
        window._favoriteBooks
    ];
    
    for (const collection of possibleCollections) {
        if (Array.isArray(collection)) {
            const book = collection.find(b => b.id === bookId || b.bookId === bookId);
            if (book) return book;
        }
    }
    
    return null;
}

/**
 * Carga y renderiza la lista de libros favoritos
 */
function loadFavorites() {
    const container = document.getElementById('favorites-books-container');
    if (!container) return;
    
    // Mostrar indicador de carga
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando favoritos...</div>';
    
    fetch(FAVORITES_CONFIG.API_BASE, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error obteniendo favoritos');
        return res.json();
    })
    .then(data => {
        console.log("Datos de favoritos recibidos:", data);
        
        const favorites = Array.isArray(data) ? data : (data.favorites || []);
        
        // Actualizar contador si existe
        const counter = document.querySelector('.favorites-count');
        if (counter) counter.textContent = favorites.length;
        
        // Renderizar favoritos
        renderFavorites(favorites);
        
        // Actualizar iconos en otras secciones
        updateFavoriteIcons(favorites.map(f => f.bookId));
    })
    .catch(error => {
        console.error('Error cargando favoritos:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No se pudieron cargar los favoritos.</p>
                <button onclick="loadFavorites()" class="retry-btn">Reintentar</button>
            </div>
        `;
    });
}

/**
 * Renderiza la lista de libros favoritos
 */
function renderFavorites(favorites) {
    const container = document.getElementById('favorites-books-container');
    if (!container) return;
    
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
    
    container.innerHTML = favorites.map(book => renderBookCardHTML(book, true)).join('');
}

/**
 * Genera HTML para una tarjeta de libro
 */
function renderBookCardHTML(book, isFavorite = false) {
    const bookId = book.bookId || book.id;
    const title = book.bookTitle || book.title || 'Título desconocido';
    const authors = book.authors || 'Autor desconocido';
    const coverUrl = book.coverUrl || 
                    (book.bookCoverId ? `https://covers.openlibrary.org/b/id/${book.bookCoverId}-M.jpg` : FAVORITES_CONFIG.DEFAULT_COVER);
    
    return `
        <div class="book-card" data-book-id="${bookId}" data-book-title="${title}" data-book-author="${authors}">
            <div class="book-cover">
                <img src="${coverUrl}" alt="${title}" onerror="this.src='${FAVORITES_CONFIG.DEFAULT_COVER}'">
                <span class="favorite-icon ${isFavorite ? 'active' : ''}" 
                      title="${isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}"
                      onclick="event.stopPropagation(); toggleFavorite('${bookId}', ${isFavorite}, this)">
                    <i class="fas fa-star"></i>
                </span>
            </div>
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${authors}</p>
            </div>
        </div>
    `;
}

/**
 * Actualiza iconos de favoritos en toda la página
 */
function updateFavoriteIcons(favoriteBookIds) {
    document.querySelectorAll('.favorite-icon').forEach(icon => {
        const bookCard = icon.closest('[data-book-id]');
        if (bookCard) {
            const bookId = bookCard.dataset.bookId;
            const isFavorite = favoriteBookIds.includes(bookId);
            icon.classList.toggle('active', isFavorite);
            icon.title = isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos';
        }
    });
}

/**
 * Carga recomendaciones basadas en favoritos
 */
function loadRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    fetch(`${FAVORITES_CONFIG.API_BASE}/recommendations`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => res.json())
    .then(recommendations => {
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p>No hay recomendaciones disponibles. ¡Agrega libros a tus favoritos!</p>';
            return;
        }
        
        const books = recommendations.map(book => ({
            ...book,
            isFavorite: false // Las recomendaciones no son favoritos por defecto
        }));
        
        container.innerHTML = books.map(book => renderBookCardHTML(book, false)).join('');
    })
    .catch(error => {
        console.error('Error cargando recomendaciones:', error);
        container.innerHTML = '<p>Error cargando recomendaciones.</p>';
    });
}

/**
 * Dispara evento personalizado de cambio en favoritos
 */
function triggerFavoritesChange() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
        const event = new CustomEvent('favoritesChanged', {
            detail: { timestamp: Date.now(), source: 'toggleFavorite' }
        });
        window.dispatchEvent(event);
    }, FAVORITES_CONFIG.DEBOUNCE_DELAY);
}

/**
 * Configura listeners globales para cambios en favoritos
 */
function setupGlobalFavoritesListener() {
    if (_favoritesListenerConfigured) return;
    
    window.addEventListener('favoritesChanged', () => {
        // Actualizar recomendaciones si existe la función
        if (typeof loadRecommendations === 'function') {
            loadRecommendations();
        }
        
        // Recargar favoritos
        if (document.getElementById('favorites-books-container')) {
            loadFavorites();
        }
    });
    
    _favoritesListenerConfigured = true;
}

/**
 * Función auxiliar para mostrar notificaciones
 * Debe ser implementada en tu proyecto o usar una librería
 */
function showNotification(message, duration = 2000) {
    // Implementación básica - personalizar según tu proyecto
    console.log(`Notificación: ${message}`);
    
    // Ejemplo de implementación simple
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, duration);
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Registrar funciones globales
    window.toggleFavorite = toggleFavorite;
    window.loadFavorites = loadFavorites;
    window.renderFavorites = renderFavorites;
    window.loadRecommendations = loadRecommendations;
    window.triggerFavoritesChange = triggerFavoritesChange;
    window.extractBookAuthors = extractBookAuthors;
    window.extractCoverIdFromSrc = extractCoverIdFromElement;
    
    // Configurar listeners
    setupGlobalFavoritesListener();
    
    // Cargar favoritos si estamos en la página correspondiente
    if (document.getElementById('favorites-books-container')) {
        loadFavorites();
    }
    
    // Cargar recomendaciones si estamos en la página principal
    if (document.getElementById('recommendations-container')) {
        loadRecommendations();
    }
    
    console.log('Sistema de favoritos inicializado correctamente');
});