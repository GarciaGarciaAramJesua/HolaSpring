/**
 * Motor de recomendaciones - Genera recomendaciones basadas en los favoritos del usuario
 * Este archivo puede permanecer igual que el anterior, ya que no tiene dependencias directas 
 * con la estructura HTML
 */

// Usamos el objeto _recEngine definido en recommendations.js
// Si no existe, lo creamos
if (!window._recEngine) {
    window._recEngine = {
        cachedRecommendations: null,
        lastUpdateTimestamp: null,
        userPreferences: null
    };
}

/**
 * Genera recomendaciones para el usuario actual
 * @param {number} limit - Número máximo de recomendaciones
 * @returns {Promise<Array>} - Array de libros recomendados
 */
async function generateRecommendations(limit = 15) {
    try {
        // Verificar si tenemos recomendaciones en caché (válidas por 1 hora)
        if (cachedRecommendations && lastUpdate && 
            Date.now() - lastUpdate < 3600000) {
            return cachedRecommendations.slice(0, limit);
        }

        // Obtener favoritos del usuario
        const response = await fetch('/api/favorites', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const favoritesData = await response.json();
        const favorites = favoritesData.favorites || [];

        if (favorites.length === 0) {
            return await getGeneralRecommendations(limit);
        }

        // Analizar preferencias del usuario
        userPreferences = await analyzeUserPreferences(favorites);

        // Generar recomendaciones basadas en preferencias
        const recommendations = await findRecommendedBooks(userPreferences, favorites, limit);

        // Guardar en caché
        cachedRecommendations = recommendations;
        lastUpdate = Date.now();

        return recommendations;

    } catch (error) {
        console.error('Error generando recomendaciones:', error);
        return await getGeneralRecommendations(limit);
    }
}

/**
 * Analiza los favoritos del usuario para extraer preferencias
 * @param {Array} favorites - Array de libros favoritos
 * @returns {Promise<Object>} - Objeto con las preferencias del usuario
 */
async function analyzeUserPreferences(favorites) {
    const preferences = {
        authors: new Map(),
        subjects: new Map(),
        languages: new Map(),
        publishDecades: new Map(),
        totalBooks: favorites.length
    };

    // Obtener detalles de cada favorito
    const detailsPromises = favorites.map(async (favorite) => {
        try {
            const response = await fetch(`https://openlibrary.org/works/${favorite.bookId}.json`);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Error obteniendo detalles del libro ${favorite.bookId}:`, error);
            return null;
        }
    });

    const booksDetails = (await Promise.all(detailsPromises)).filter(book => book !== null);

    // Analizar cada libro
    for (const book of booksDetails) {
        // Analizar autores
        if (book.authors && book.authors.length > 0) {
            const authorPromises = book.authors.map(async (authorRef) => {
                try {
                    if (authorRef.author) {
                        const response = await fetch(`https://openlibrary.org${authorRef.author.key}.json`);
                        if (!response.ok) throw new Error(`Error: ${response.status}`);
                        const author = await response.json();
                        return author.name;
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            });
            
            const authorNames = (await Promise.all(authorPromises)).filter(name => name !== null);
            
            authorNames.forEach(author => {
                if (author) {
                    const count = preferences.authors.get(author) || 0;
                    preferences.authors.set(author, count + 1);
                }
            });
        }

        // Analizar materias/categorías
        if (book.subjects && book.subjects.length > 0) {
            book.subjects.forEach(subject => {
                if (subject && typeof subject === 'string') {
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
        if (book.languages && book.languages.length > 0) {
            book.languages.forEach(lang => {
                const count = preferences.languages.get(lang) || 0;
                preferences.languages.set(lang, count + 1);
            });
        }
    }

    // Convertir Maps a arrays ordenados por frecuencia
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
 * @param {Object} preferences - Preferencias del usuario
 * @param {Array} favorites - Libros favoritos (para evitar duplicados)
 * @param {number} limit - Límite de recomendaciones
 * @returns {Promise<Array>} - Array de libros recomendados
 */
async function findRecommendedBooks(preferences, favorites, limit) {
    const recommendedBooks = new Map(); // Usar Map para evitar duplicados
    const favoriteIds = new Set(favorites.map(f => f.bookId));

    try {
        // 1. Buscar por autores favoritos (40% peso)
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

        // 2. Buscar por materias favoritas (35% peso)
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

        // 3. Buscar libros populares en categorías de interés (25% peso)
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

    // Convertir Map a Array y ordenar por puntuación
    return Array.from(recommendedBooks.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Busca libros por autor
 * @param {string} author - Nombre del autor
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Libros encontrados
 */
async function searchBooksByAuthor(author, limit = 10) {
    try {
        const response = await fetch(`${OPENLIBRARY_API.SEARCH}?author=${encodeURIComponent(author)}&limit=${limit}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        return data.docs.map(book => formatBookForRecommendation({
            ...book,
            author_name: [author], // Asegurar que el autor esté presente  
            cover_i: book.cover_i,
            title: book.title,
            key: book.key || `/works/${book.key.replace('/works/', '')}`
        }));
    } catch (error) {
        console.warn(`Error buscando libros del autor ${author}:`, error);
        return [];
    }
}

/**
 * Busca libros por materia/subject
 * @param {string} subject - Materia a buscar
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Libros encontrados
 */
async function searchBooksBySubject(subject, limit = 10) {
    try {
        // Método 1: Búsqueda por subject
        const response = await fetch(`${OPENLIBRARY_API.SEARCH}?subject=${encodeURIComponent(subject)}&limit=${limit}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        if (data.docs.length > 0) {
            return data.docs.map(book => formatBookForRecommendation({
                ...book,
                subject: [subject],
                cover_i: book.cover_i,
                key: book.key || `/works/${book.key?.replace('/works/', '')}`
            }));
        }

        // Método 2: Búsqueda alternativa si no hay resultados
        const altResponse = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(subject)}&limit=${limit}`);
        if (!altResponse.ok) throw new Error(`Error: ${altResponse.status}`);
        const altData = await altResponse.json();
        
        return altData.docs.map(book => formatBookForRecommendation({
            ...book,
            subject: [subject],
            cover_i: book.cover_i,
            key: book.key || `/works/${book.key?.replace('/works/', '')}`
        }));
    } catch (error) {
        console.warn(`Error buscando libros de la materia ${subject}:`, error);
        return [];
    }
}

/**
 * Obtiene libros populares en una materia específica
 * @param {string} subject - Materia a buscar
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} - Libros encontrados
 */
async function getPopularBooksInSubject(subject, limit = 10) {
    try {
        // Intentar con términos de búsqueda derivados de la materia
        const searchTerms = getSubjectSearchTerms(subject);
        
        for (const term of searchTerms) {
            try {
                const response = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(term)}&limit=${Math.ceil(limit / 2)}`);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const data = await response.json();
                
                if (data.docs.length > 0) {
                    return data.docs.slice(0, limit).map(book => formatBookForRecommendation({
                        ...book,
                        subject: [subject],
                        cover_i: book.cover_i,
                        key: book.key || `/works/${book.key?.replace('/works/', '')}`
                    }));
                }
            } catch (termError) {
                console.warn(`Error con término de búsqueda ${term}:`, termError);
                continue;
            }
        }

        // Fallback con términos generales
        const fallbackResponse = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(subject.replace(/[_-]/g, ' '))}&limit=${limit}`);
        if (!fallbackResponse.ok) throw new Error(`Error: ${fallbackResponse.status}`);
        const fallbackData = await fallbackResponse.json();
        
        return fallbackData.docs.map(book => formatBookForRecommendation({
            ...book,
            subject: [subject],
            cover_i: book.cover_i,
            key: book.key || `/works/${book.key?.replace('/works/', '')}`
        }));
    } catch (error) {
        console.warn(`Error obteniendo libros populares de ${subject}:`, error);
        return [];
    }
}

/**
 * Recomendaciones generales para usuarios sin favoritos
 * @param {number} limit - Límite de recomendaciones
 * @returns {Promise<Array>} - Recomendaciones generales
 */
async function getGeneralRecommendations(limit = 15) {
    const popularTerms = [
        'popular fiction', 'bestseller', 'classic literature', 
        'fantasy adventure', 'mystery thriller', 'science fiction',
        'historical fiction', 'contemporary fiction', 'biography'
    ];
    const recommendations = [];

    for (const term of popularTerms) {
        try {
            const response = await fetch(`${OPENLIBRARY_API.SEARCH}?q=${encodeURIComponent(term)}&limit=2`);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
            const data = await response.json();
            
            recommendations.push(...data.docs.map(book => formatBookForRecommendation({
                ...book,
                cover_i: book.cover_i,
                key: book.key || `/works/${book.key?.replace('/works/', '')}`,
                reason: 'Recomendación popular',
                score: Math.random() // Puntuación aleatoria para variedad
            })));

            // Evitar hacer demasiadas peticiones
            if (recommendations.length >= limit) break;
        } catch (error) {
            console.warn(`Error obteniendo recomendaciones generales para ${term}:`, error);
        }
    }

    return recommendations.slice(0, limit);
}

/**
 * Calcula la puntuación de un libro basada en las preferencias del usuario
 * @param {Object} book - Libro a evaluar
 * @param {Object} preferences - Preferencias del usuario
 * @returns {number} - Puntuación del libro
 */
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
 * Formatea los datos de un libro para su uso en recomendaciones
 * @param {Object} book - Datos del libro de la API
 * @returns {Object} - Datos formateados
 */
function formatBookForRecommendation(book) {
    // Determinar el ID de portada desde múltiples fuentes
    const coverId = book.cover_i || book.cover_id || book.covers?.[0] || book.coverId;
    
    // Crear URL de portada con fallback robusto
    let coverUrl = DEFAULT_COVER;
    if (coverId) {
        coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    } else if (book.coverUrl) {
        coverUrl = book.coverUrl;
    }

    // Formatear autores correctamente
    let authorNames = ['Autor desconocido'];
    if (book.author_name && Array.isArray(book.author_name)) {
        authorNames = book.author_name;
    } else if (book.authors && Array.isArray(book.authors)) {
        if (typeof book.authors[0] === 'string') {
            authorNames = book.authors;
        } else if (book.authors[0]?.name) {
            authorNames = book.authors.map(a => a.name);
        }
    } else if (typeof book.authors === 'string') {
        authorNames = [book.authors];
    }

    // Extraer ID desde la key
    const id = book.key 
        ? book.key.replace('/works/', '') 
        : (book.id || book.cover_edition_key);

    return {
        id: id,
        title: book.title || 'Título desconocido',
        authors: authorNames.join(', '),
        authorNames: authorNames,
        subjects: book.subject || book.subjects || [],
        first_publish_date: book.first_publish_year || book.first_publish_date,
        publishYear: book.first_publish_year || book.first_publish_date || 'Año desconocido',
        coverUrl: coverUrl,
        coverId: coverId
    };
}

/**
 * Funciones auxiliares
 */

/**
 * Normaliza una materia para estandarizar comparaciones
 * @param {string} subject - Materia a normalizar
 * @returns {string} - Materia normalizada
 */
function normalizeSubject(subject) {
    return subject.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extrae la década de una fecha
 * @param {string} dateString - Fecha en formato string
 * @returns {number|null} - Década extraída o null
 */
function extractDecade(dateString) {
    const year = parseInt(dateString);
    if (isNaN(year)) return null;
    return Math.floor(year / 10) * 10;
}

/**
 * Obtiene las entradas top de un Map ordenadas por valor
 * @param {Map} map - Map a ordenar
 * @param {number} limit - Límite de entradas
 * @returns {Array} - Array de entradas ordenadas
 */
function getTopEntries(map, limit) {
    return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

/**
 * Genera términos de búsqueda alternativos para una materia
 * @param {string} subject - Materia base
 * @returns {Array} - Términos de búsqueda alternativos
 */
function getSubjectSearchTerms(subject) {
    const baseTerms = [subject];
    
    // Mapear términos comunes
    const subjectMappings = {
        'fiction': ['fiction', 'novel', 'story'],
        'fantasy': ['fantasy', 'magic', 'dragons'],
        'science_fiction': ['science fiction', 'sci-fi', 'space'],
        'mystery': ['mystery', 'detective', 'crime'],
        'biography': ['biography', 'memoir', 'life story'],
        'history': ['history', 'historical', 'past'],
        'romance': ['romance', 'love story', 'romantic'],
        'thriller': ['thriller', 'suspense', 'action'],
        'horror': ['horror', 'scary', 'supernatural'],
        'poetry': ['poetry', 'poems', 'verse']
    };

    const mappedTerms = subjectMappings[subject.toLowerCase()] || [];
    return [...baseTerms, ...mappedTerms];
}

// El resto del archivo recommendations-engine.js permanece igual
// Mantenemos todas las funciones auxiliares como analyzeUserPreferences, 
// findRecommendedBooks, searchBooksByAuthor, etc.