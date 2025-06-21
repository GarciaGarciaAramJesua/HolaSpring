/**
 * Solución mejorada para la función toggleFavorite
 * Con mejor extracción de datos de los libros
 */
function toggleFavorite(bookId, isFavorite, iconElement) {
    const method = isFavorite ? "DELETE" : "POST";
    
    // Necesitamos encontrar mejor los datos del libro
    let bookTitle = "Título desconocido";
    let bookCoverId = null;
    
    // Estrategias para encontrar el elemento del libro
    const bookCard = findBookElement(bookId, iconElement);
    
    if (bookCard) {
        // Intentar obtener el título del libro con selectores más flexibles
        bookTitle = extractBookTitle(bookCard);
        
        // Intentar obtener el ID de la portada
        bookCoverId = extractCoverIdFromElement(bookCard);
    }
    
    // Si no podemos obtener el título/coverID desde los elementos del DOM,
    // intentamos buscarlo en las colecciones de libros en memoria
    if (bookTitle === "Título desconocido" || bookCoverId === null) {
        const bookData = findBookInCollections(bookId);
        if (bookData) {
            if (bookTitle === "Título desconocido" && bookData.title) {
                bookTitle = bookData.title;
            }
            if (bookCoverId === null && bookData.coverId) {
                bookCoverId = bookData.coverId;
            }
        }
    }
    
    console.log(`Toggle favorito: ${bookId}, título: ${bookTitle}, coverID: ${bookCoverId}`);
    
    // Configurar opciones para la solicitud
    const requestOptions = {
        method: method,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
        }
    };
    
    // Solo para POST añadimos el body con todos los campos requeridos
    if (method === "POST") {
        requestOptions.body = JSON.stringify({
            bookId: bookId,
            bookTitle: bookTitle,
            bookCoverId: bookCoverId
        });
    }
    
    // Realizar la solicitud
    fetch(`/api/favorites/${bookId}`, requestOptions)
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
            console.log('Respuesta favorito:', data);
            
            // Actualizar UI: cambiar icono
            if (iconElement) iconElement.classList.toggle('active', !isFavorite);
            
            // Mostrar notificación
            showNotification(isFavorite ? "Eliminado de favoritos" : "Agregado a favoritos", 2000);
            
            // Recargar favoritos
            if (typeof loadFavorites === 'function') {
                loadFavorites();
            }
            
            // Notificar cambio
            if (typeof triggerFavoritesChange === 'function') {
                triggerFavoritesChange();
            }
        })
        .catch(error => {
            console.error('Error en toggleFavorite:', error);
            showNotification("No se pudo actualizar el favorito: " + error.message, 3000);
        });
}

/**
 * Encuentra el elemento del libro utilizando varias estrategias
 */
function findBookElement(bookId, iconElement) {
    // Estrategia 1: A partir del ícono de favorito
    if (iconElement) {
        const card = iconElement.closest('.book-card');
        if (card) return card;
    }
    
    // Estrategia 2: Buscar por atributo data-book-id
    const cardWithDataAttr = document.querySelector(`[data-book-id="${bookId}"]`);
    if (cardWithDataAttr) return cardWithDataAttr;
    
    // Estrategia 3: Buscar por elementos que tengan el ID en algún enlace o atributo
    const allBookElements = document.querySelectorAll('.book-card, .book-item, .favorite-card');
    for (const element of allBookElements) {
        // Verificar si algún enlace o botón dentro tiene el ID
        const links = element.querySelectorAll('a[href*="' + bookId + '"], [onclick*="' + bookId + '"]');
        if (links.length > 0) return element;
    }
    
    return null;
}

/**
 * Extrae el título del libro desde diferentes elementos posibles
 */
function extractBookTitle(element) {
    // Intentar varios selectores comunes para el título
    const titleSelectors = [
        'h3', '.book-title', '.favorite-card-title', 
        '[data-book-title]', 'h4', '.title'
    ];
    
    for (const selector of titleSelectors) {
        const titleElement = element.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
            return titleElement.textContent.trim();
        }
    }
    
    // Verificar si el elemento mismo tiene un atributo con el título
    if (element.dataset.bookTitle) {
        return element.dataset.bookTitle;
    }
    
    return "Título desconocido";
}

/**
 * Extrae el ID de la portada de un libro desde diferentes fuentes
 */
function extractCoverIdFromElement(element) {
    // Verificar si el elemento tiene el dato en un atributo
    if (element.dataset.bookCoverId) {
        return element.dataset.bookCoverId;
    }
    
    // Buscar en la imagen
    const img = element.querySelector('img');
    if (img && img.src) {
        // Patrón 1: URL como "https://covers.openlibrary.org/b/id/12345-M.jpg"
        const match1 = img.src.match(/\/id\/(\d+)/);
        if (match1 && match1[1]) {
            return match1[1];
        }
        
        // Patrón 2: URL con olid
        const match2 = img.src.match(/\/olid\/([A-Za-z0-9]+)/);
        if (match2 && match2[1]) {
            return match2[1];
        }
    }
    
    return null;
}

/**
 * Busca el libro en colecciones de datos en memoria
 */
function findBookInCollections(bookId) {
    // Intentar encontrar en colecciones globales que el código haya creado
    const possibleCollections = [
        // Buscar en la caché de recomendaciones si existe
        window._recEngine?.cachedRecommendations,
        // O en cualquier otra colección global de libros
        window._lastSearchResults,
        window._cachedBooks
    ];
    
    for (const collection of possibleCollections) {
        if (Array.isArray(collection)) {
            const book = collection.find(b => b.id === bookId);
            if (book) return book;
        }
    }
    
    // Si no encontramos en colecciones, intentar reconstruir desde el ID
    // En OpenLibrary, los IDs suelen tener un patrón que nos da pistas
    if (bookId.startsWith('OL') && bookId.endsWith('W')) {
        // Es un ID de Works de OpenLibrary, intentar extraer el número
        const olNumber = bookId.replace('OL', '').replace('W', '');
        if (!isNaN(olNumber)) {
            return {
                id: bookId,
                title: null, // No podemos inferir el título
                coverId: null // No podemos inferir el coverId
            };
        }
    }
    
    return null;
}

// Función auxiliar para extraer el coverId de una URL de imagen
function extractCoverIdFromSrc(src) {
    if (!src) return null;
    
    // Patrón para URL de covers.openlibrary.org
    const match = src.match(/\/covers\/[^\/]+\/([^-\.]+)/);
    return match ? match[1] : null;
}

// Instalar la función corregida
document.addEventListener('DOMContentLoaded', function() {
    window.toggleFavorite = toggleFavorite;
    
    // También exportar funciones útiles para uso en otros scripts
    window.extractCoverIdFromSrc = extractCoverIdFromSrc;
});