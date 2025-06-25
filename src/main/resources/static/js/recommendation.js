/**
 * Sistema unificado de recomendaciones para libros
 * Combina y optimiza las funcionalidades de:
 * - recommendations.js
 * - recommendations-engine.js
 * - recommendations-enhanced.js
 * - recommendations-update.js
 * - recommend-fix.js
 */

// Constantes globales
const DEFAULT_COVER = '/images/default-book-cover.jpg';
const OPENLIBRARY_API = {
    SEARCH: 'https://openlibrary.org/search.json'
};
const CACHE_TTL = 120000; // 2 minutos de caché (en ms)

// Objeto principal del motor de recomendaciones
window._recEngine = {
    cachedRecommendations: null,
    lastUpdateTimestamp: null,
    userPreferences: null,
    swiperInstance: null
};

/**
 * Carga y muestra las recomendaciones en el contenedor especificado
 */
async function loadRecommendations() {
    const container = document.getElementById('recommendations-container');
    const loadingContainer = document.getElementById('loading-container');
    
    if (!container) return;
    
    // Mostrar indicador de carga
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    
    try {
        // Generar recomendaciones (limitado a 6 para la vista principal)
        const recommendations = await generateRecommendations(6);
        
        // Ocultar indicador de carga
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
        // Mostrar mensaje si no hay recomendaciones
        if (!recommendations.length) {
            container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles. Añade algunos favoritos para recibir recomendaciones personalizadas.</p>';
            return;
        }
        
        // Renderizar las recomendaciones
        renderRecommendationsWithSwiper(recommendations, container);
        
    } catch (error) {
        console.error('Error cargando recomendaciones:', error);
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        container.innerHTML = '<p class="error-message">No se pudieron cargar las recomendaciones. Intente nuevamente.</p>';
    }
}

/**
 * Genera recomendaciones para el usuario actual
 * @param {number} limit - Número máximo de recomendaciones
 * @returns {Promise<Array>} - Array de libros recomendados
 */
async function generateRecommendations(limit = 15) {
    try {
        // Verificar caché válido
        if (_recEngine.cachedRecommendations && _recEngine.lastUpdateTimestamp && 
            Date.now() - _recEngine.lastUpdateTimestamp < CACHE_TTL) {
            return _recEngine.cachedRecommendations.slice(0, limit);
        }

        // Obtener favoritos del usuario
        const favorites = await getUserFavorites();
        
        if (favorites.length === 0) {
            return await getGeneralRecommendations(limit);
        }

        // Analizar preferencias del usuario
        _recEngine.userPreferences = await analyzeUserPreferences(favorites);

        // Generar recomendaciones basadas en preferencias
        const recommendations = await findRecommendedBooks(_recEngine.userPreferences, favorites, limit);

        // Actualizar caché
        _recEngine.cachedRecommendations = recommendations;
        _recEngine.lastUpdateTimestamp = Date.now();

        return recommendations;

    } catch (error) {
        console.error('Error generando recomendaciones:', error);
        return await getGeneralRecommendations(limit);
    }
}

/**
 * Renderiza las recomendaciones usando Swiper
 */
function renderRecommendationsWithSwiper(books, container) {
    if (!books || books.length === 0) {
        container.innerHTML = '<p class="no-results">No hay recomendaciones disponibles.</p>';
        return;
    }
    
    // Destruir Swiper previo si existe
    if (_recEngine.swiperInstance) {
        _recEngine.swiperInstance.destroy();
        _recEngine.swiperInstance = null;
    }
    
    // Crear HTML para el carrusel
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
    
    // Limpiar y actualizar el contenedor
    container.innerHTML = swiperHTML;
    
    // Inicializar Swiper
    _recEngine.swiperInstance = new Swiper(container.querySelector('.swiper-container'), {
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
    
    // Manejar carga de imágenes para actualizar Swiper
    handleImageLoading(container);
    
    // Configurar eventos de clic en las tarjetas
    setupBookCardClickHandlers(container);
    
    // Marcar favoritos
    checkAndMarkFavorites();
}

/**
 * Obtiene los libros favoritos del usuario
 */
async function getUserFavorites() {
    try {
        const response = await fetch('/api/favorites', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const data = await response.json();
        return data.favorites || [];
        
    } catch (error) {
        console.error('Error obteniendo favoritos:', error);
        return [];
    }
}

/**
 * Analiza los favoritos del usuario para extraer preferencias
 */
async function analyzeUserPreferences(favorites) {
    const preferences = {
        authors: new Map(),
        subjects: new Map(),
        languages: new Map(),
        publishDecades: new Map(),
        totalBooks: favorites.length
    };

    const booksDetails = await getBooksDetails(favorites);
    
    // Analizar cada libro
    for (const book of booksDetails) {
        // Analizar autores
        if (book.authors?.length > 0) {
            const authorNames = await getAuthorNames(book.authors);
            authorNames.forEach(author => {
                const count = preferences.authors.get(author) || 0;
                preferences.authors.set(author, count + 1);
            });
        }

        // Analizar materias
        if (book.subjects?.length > 0) {
            book.subjects.forEach(subject => {
                if (typeof subject === 'string') {
                    const normalizedSubject = normalizeSubject(subject);
                    const count = preferences.subjects.get(normalizedSubject) || 0;
                    preferences.subjects.set(normalizedSubject, count + 1);
                }
            });
        }

        // Analizar décadas de publicación
        if (book.first_publish_date) {
            const decade = extractDecade(book.first_publish_date);
            if (decade) {
                const count = preferences.publishDecades.get(decade) || 0;
                preferences.publishDecades.set(decade, count + 1);
            }
        }

        // Analizar idiomas
        if (book.languages?.length > 0) {
            book.languages.forEach(lang => {
                const count = preferences.languages.get(lang) || 0;
                preferences.languages.set(lang, count + 1);
            });
        }
    }

    return {
        topAuthors: getTopEntries(preferences.authors, 5),
        topSubjects: getTopEntries(preferences.subjects, 8),
        topDecades: getTopEntries(preferences.publishDecades, 3),
        topLanguages: getTopEntries(preferences.languages, 2),
        totalAnalyzed: booksDetails.length
    };
}

/**
 * Encuentra libros recomendados basados en las preferencias
 */
async function findRecommendedBooks(preferences, favorites, limit) {
    const recommendedBooks = new Map();
    const favoriteIds = new Set(favorites.map(f => f.bookId));

    try {
        // Buscar por autores favoritos (40% peso)
        for (const [author, count] of preferences.topAuthors.slice(0, 3)) {
            const books = await searchBooksByAuthor(author, 8);
            books.forEach(book => {
                if (!favoriteIds.has(book.id)) {
                    const score = calculateBookScore(book, preferences) + (count * 0.4);
                    if (!recommendedBooks.has(book.id) || recommendedBooks.get(book.id).score < score) {
                        recommendedBooks.set(book.id, { ...book, score, reason: `Porque te gusta ${author}` });
                    }
                }
            });
        }

        // Buscar por materias favoritas (35% peso)
        for (const [subject, count] of preferences.topSubjects.slice(0, 4)) {
            const books = await searchBooksBySubject(subject, 6);
            books.forEach(book => {
                if (!favoriteIds.has(book.id)) {
                    const score = calculateBookScore(book, preferences) + (count * 0.35);
                    if (!recommendedBooks.has(book.id) || recommendedBooks.get(book.id).score < score) {
                        recommendedBooks.set(book.id, { ...book, score, reason: `Basado en tu interés en ${subject}` });
                    }
                }
            });
        }

        // Buscar libros populares en categorías de interés (25% peso)
        for (const [subject] of preferences.topSubjects.slice(0, 2)) {
            const books = await getPopularBooksInSubject(subject, 5);
            books.forEach(book => {
                if (!favoriteIds.has(book.id)) {
                    const score = calculateBookScore(book, preferences) + 0.25;
                    if (!recommendedBooks.has(book.id) || recommendedBooks.get(book.id).score < score) {
                        recommendedBooks.set(book.id, { ...book, score, reason: `Popular en ${subject}` });
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error buscando recomendaciones:', error);
    }

    // Convertir a array, ordenar y limitar
    return Array.from(recommendedBooks.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Funciones auxiliares para búsqueda de libros
 */
async function searchBooksByAuthor(author, limit = 10) {
    try {
        const response = await fetch(`${OPENLIBRARY_API.SEARCH}?author=${encodeURIComponent(author)}&limit=${limit}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        return data.docs.map(book => formatBookForRecommendation(book));
    } catch (error) {
        console.warn(`Error buscando libros del autor ${author}:`, error);
        return [];
    }
}

async function searchBooksBySubject(subject, limit = 10) {
    try {
        const response = await fetch(`${OPENLIBRALLibrary_API.SEARCH}?subject=${encodeURIComponent(subject)}&limit=${limit}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        return data.docs.map(book => formatBookForRecommendation(book));
    } catch (error) {
        console.warn(`Error buscando libros de la materia ${subject}:`, error);
        return [];
    }
}

async function getPopularBooksInSubject(subject, limit = 10) {
    try {
        const searchTerms = getSubjectSearchTerms(subject);
        
        for (const term of searchTerms) {
            try {
                const response = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(term)}&limit=${Math.ceil(limit / 2)}`);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const data = await response.json();
                if (data.docs.length > 0) {
                    return data.docs.slice(0, limit).map(book => formatBookForRecommendation(book));
                }
            } catch (termError) {
                continue;
            }
        }

        // Fallback
        const fallbackResponse = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(subject.replace(/[_-]/g, ' '))}&limit=${limit}`);
        if (!fallbackResponse.ok) throw new Error(`Error: ${fallbackResponse.status}`);
        const fallbackData = await fallbackResponse.json();
        return fallbackData.docs.map(book => formatBookForRecommendation(book));
    } catch (error) {
        console.warn(`Error obteniendo libros populares de ${subject}:`, error);
        return [];
    }
}

async function getGeneralRecommendations(limit = 15) {
    const popularTerms = [
        'popular fiction', 'bestseller', 'classic literature', 
        'fantasy adventure', 'mystery thriller', 'science fiction'
    ];
    const recommendations = [];

    for (const term of popularTerms) {
        try {
            const response = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(term)}&limit=2`);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const data = await response.json();
            
            recommendations.push(...data.docs.map(book => formatBookForRecommendation({
                ...book,
                reason: 'Recomendación popular',
                score: Math.random()
            })));

            if (recommendations.length >= limit) break;
        } catch (error) {
            console.warn(`Error obteniendo recomendaciones generales para ${term}:`, error);
        }
    }

    return recommendations.slice(0, limit);
}

/**
 * Formatea los datos de un libro para recomendaciones
 */
function formatBookForRecommendation(book) {
    const coverId = book.cover_i || book.cover_id || book.covers?.[0] || book.coverId;
    let coverUrl = DEFAULT_COVER;
    if (coverId) coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    else if (book.coverUrl) coverUrl = book.coverUrl;

    // Formatear autores
    let authorNames = ['Autor desconocido'];
    if (book.author_name?.length) {
        authorNames = book.author_name;
    } else if (book.authors?.length) {
        if (typeof book.authors[0] === 'string') {
            authorNames = book.authors;
        } else if (book.authors[0]?.name) {
            authorNames = book.authors.map(a => a.name);
        }
    } else if (typeof book.authors === 'string') {
        authorNames = [book.authors];
    }

    // Extraer ID
    const id = book.key?.replace('/works/', '') || book.id || book.cover_edition_key;

    return {
        id,
        title: book.title || 'Título desconocido',
        authors: authorNames.join(', '),
        authorNames,
        subjects: book.subject || book.subjects || [],
        first_publish_date: book.first_publish_year || book.first_publish_date,
        publishYear: book.first_publish_year || book.first_publish_date || 'Año desconocido',
        coverUrl,
        coverId
    };
}

/**
 * Funciones utilitarias
 */
function normalizeSubject(subject) {
    return subject.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractDecade(dateString) {
    const year = parseInt(dateString);
    return isNaN(year) ? null : Math.floor(year / 10) * 10;
}

function getTopEntries(map, limit) {
    return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

function getSubjectSearchTerms(subject) {
    const baseTerms = [subject];
    const subjectMappings = {
        'fiction': ['fiction', 'novel', 'story'],
        'fantasy': ['fantasy', 'magic', 'dragons'],
        'science_fiction': ['science fiction', 'sci-fi', 'space'],
        'mystery': ['mystery', 'detective', 'crime']
    };
    const mappedTerms = subjectMappings[subject.toLowerCase()] || [];
    return [...baseTerms, ...mappedTerms];
}

function calculateBookScore(book, preferences) {
    let score = 0;

    // Puntuación por autor
    if (book.authorNames) {
        book.authorNames.forEach(author => {
            const authorScore = preferences.topAuthors.find(([a]) => a === author);
            if (authorScore) score += authorScore[1] * 0.3;
        });
    }

    // Puntuación por materia
    if (book.subjects) {
        book.subjects.forEach(subject => {
            const normalizedSubject = normalizeSubject(subject);
            const subjectScore = preferences.topSubjects.find(([s]) => s === normalizedSubject);
            if (subjectScore) score += subjectScore[1] * 0.2;
        });
    }

    // Puntuación por década
    if (book.first_publish_date) {
        const decade = extractDecade(book.first_publish_date);
        const decadeScore = preferences.topDecades.find(([d]) => d === decade);
        if (decadeScore) score += decadeScore[1] * 0.1;
    }

    return score;
}

/**
 * Manejo de eventos y UI
 */
function handleImageLoading(container) {
    const images = container.querySelectorAll('img');
    let loadedCount = 0;
    
    images.forEach(img => {
        if (img.complete) {
            imageLoaded();
        } else {
            img.onload = imageLoaded;
            img.onerror = imageLoaded;
        }
    });
    
    function imageLoaded() {
        loadedCount++;
        if (loadedCount === images.length && _recEngine.swiperInstance) {
            _recEngine.swiperInstance.update();
        }
    }
}

function setupBookCardClickHandlers(container) {
    container.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.favorite-icon')) return;
            const bookId = card.getAttribute('data-book-id');
            if (bookId) window.location.href = `/libro-detalle?id=${bookId}`;
        });
    });
}

async function checkAndMarkFavorites() {
    try {
        const response = await fetch('/api/favorites', {
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        const favoriteIds = (data.favorites || []).map(fav => fav.bookId);
        
        document.querySelectorAll('.book-card').forEach(card => {
            const bookId = card.dataset.bookId;
            if (bookId) {
                const icon = card.querySelector('.favorite-icon');
                if (icon) icon.classList.toggle('active', favoriteIds.includes(bookId));
            }
        });
    } catch (err) {
        console.error("Error verificando favoritos:", err);
    }
}

/**
 * Manejo de actualizaciones en tiempo real
 */
function forceRefreshRecommendations() {
    if (window._recEngine) {
        window._recEngine.cachedRecommendations = null;
        window._recEngine.lastUpdateTimestamp = null;
        window._recEngine.userPreferences = null;
    }
    
    loadRecommendations();
}

function overrideToggleFavorite() {
    const originalToggle = window.toggleFavorite;
    if (typeof originalToggle === 'function') {
        window.toggleFavorite = function(bookId, isFavorite, iconElement) {
            const result = originalToggle(bookId, isFavorite, iconElement);
            setTimeout(forceRefreshRecommendations, 1000);
            return result;
        };
    }
}

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', function() {
    // Añadir estilos CSS
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        #recommendations-container .swiper-container {
            height: auto;
            min-height: 380px;
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
        /* ... (otros estilos del CSS original) ... */
    `;
    document.head.appendChild(styleSheet);
    
    // Sobrescribir toggleFavorite
    overrideToggleFavorite();
    
    // Cargar recomendaciones si estamos en la página principal
    if (['/', '/home', ''].includes(window.location.pathname)) {
        setTimeout(loadRecommendations, 500);
    }
});

// Evento para actualización manual
window.triggerFavoritesChange = function() {
    const event = new CustomEvent('favoritesChanged', {
        detail: { timestamp: Date.now(), source: 'manual', forceUpdate: true }
    });
    window.dispatchEvent(event);
};

window.addEventListener('favoritesChanged', function(event) {
    if (event.detail.source === 'manual' || event.detail.forceUpdate) {
        setTimeout(loadRecommendations, 500);
    }
});