/**
 * Sistema unificado para manejo de libros, autores y carruseles
 * Combina y optimiza las funcionalidades de:
 * - books.js
 * - authors.js
 * - carrousel.js
 */

// Constantes globales
const OPENLIBRARY_API = {
    SEARCH: 'https://openlibrary.org/search.json',
    WORK: 'https://openlibrary.org/works/',
    COVER: 'https://covers.openlibrary.org/b/id/',
    AUTHOR: 'https://openlibrary.org/authors/',
    SUBJECT: 'https://openlibrary.org/subjects/'
};

const DEFAULT_COVER = '/images/default-cover.jpg';
const CACHE_TTL = 120000; // 2 minutos de caché (en ms)

// Objeto para almacenar instancias de Swiper
const swiperInstances = {};

/**
 * Configura la página principal al cargar
 */
function setupHomePage() {
    // Cargar libros por categorías
    loadBooksByCategories();
    
    // Configurar búsqueda
    setupSearch();
    
    // Verificar si hay parámetro de búsqueda en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        document.getElementById('search-input').value = searchQuery;
        searchBooks(searchQuery);
    }
}

/**
 * Carga libros por categorías
 */
function loadBooksByCategories() {
    const categorySections = document.querySelectorAll('.category-section');
    const loadingContainer = document.getElementById('loading-container');
    
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    }
    
    const promises = Array.from(categorySections).map(section => {
        const category = section.dataset.category;
        const container = section.querySelector('.books-container');
        
        if (category && container) {
            return fetchBooksByCategory(category)
                .then(books => {
                    renderBooksWithSwiper(books, container, `${category}-swiper`);
                })
                .catch(error => {
                    console.error(`Error cargando categoría ${category}:`, error);
                    container.innerHTML = `<p class="error-message">No se pudieron cargar los libros de esta categoría.</p>`;
                });
        }
        return Promise.resolve();
    });
    
    Promise.all(promises)
        .then(() => {
            if (loadingContainer) loadingContainer.style.display = 'none';
        })
        .catch(error => {
            console.error('Error cargando categorías:', error);
            if (loadingContainer) loadingContainer.style.display = 'none';
        });
}

/**
 * Obtiene libros por categoría desde OpenLibrary
 */
function fetchBooksByCategory(category) {
    return fetch(`https://openlibrary.org/subjects/${category}.json?limit=6`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            if (data?.works?.length > 0) {
                return data.works.map(formatBookData);
            }
            return [];
        })
        .catch(error => {
            console.error(`Error en fetchBooksByCategory para ${category}:`, error);
            throw error;
        });
}

/**
 * Formatea los datos de un libro para su uso en la aplicación
 * Maneja múltiples formatos de datos de la API
 */
function formatBookData(book) {
    // Extraer ID del libro
    const id = book.key ? book.key.replace('/works/', '') : book.id || '';
    
    // Manejar múltiples formatos de autores
    let authors = 'Autor desconocido';
    if (book.author_name?.length) {
        authors = book.author_name.join(', ');
    } else if (book.authors?.length) {
        authors = book.authors.map(a => 
            typeof a === 'string' ? a : (a.name || 'Autor desconocido')
        ).join(', ');
    } else if (book.author) {
        authors = book.author;
    }
    
    // Manejar portada del libro
    const coverId = book.cover_id || book.cover_i || book.covers?.[0] || null;
    const coverUrl = coverId ? 
        `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : 
        DEFAULT_COVER;
    
    return {
        id,
        title: book.title || 'Título desconocido',
        authors,
        coverId,
        coverUrl,
        publishYear: book.first_publish_year || book.publish_year || 'Año desconocido',
        subjects: book.subject || book.subjects || []
    };
}

/**
 * Renderiza libros usando Swiper
 */
function renderBooksWithSwiper(books, container, swiperId) {
    // Limpiar contenedor y destruir Swiper previo si existe
    container.innerHTML = '';
    if (swiperInstances[swiperId]) {
        swiperInstances[swiperId].destroy();
        delete swiperInstances[swiperId];
    }

    if (!books?.length) {
        container.innerHTML = '<p class="no-results">No hay libros disponibles.</p>';
        return;
    }

    // Crear estructura HTML del carrusel
    container.innerHTML = `
        <div class="swiper-container book-carousel" id="${swiperId}">
            <div class="swiper-wrapper">
                ${books.map(book => `
                    <div class="swiper-slide">
                        <div class="book-card" data-book-id="${book.id}">
                            <div class="book-cover">
                                <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
                                <span class="favorite-icon" title="Agregar a favoritos" 
                                    onclick="event.stopPropagation(); toggleFavorite('${book.id}', this.classList.contains('active'), this)">
                                    <i class="fas fa-star"></i>
                                </span>
                            </div>
                            <div class="book-info">
                                <h3>${book.title}</h3>
                                <p>${book.authors}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>
    `;

    // Inicializar Swiper
    swiperInstances[swiperId] = new Swiper(`#${swiperId}`, {
        slidesPerView: 3,
        spaceBetween: 20,
        navigation: {
            nextEl: `#${swiperId} .swiper-button-next`,
            prevEl: `#${swiperId} .swiper-button-prev`,
        },
        breakpoints: {
            320: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    });

    // Configurar eventos
    setupBookCardEvents(container);
    checkAndMarkFavorites(container);
}

/**
 * Renderiza libros sin Swiper (para resultados de búsqueda)
 */
function renderBooksWithoutSwiper(books, container, favoriteIds = []) {
    container.innerHTML = books.map(book => {
        const isFavorite = favoriteIds.includes(book.id);
        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-cover">
                    <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
                    <span class="favorite-icon ${isFavorite ? 'active' : ''}" 
                        title="${isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}" 
                        onclick="event.stopPropagation(); toggleFavorite('${book.id}', ${isFavorite}, this)">
                        <i class="fas fa-star"></i>
                    </span>
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>${book.authors}</p>
                </div>
            </div>
        `;
    }).join('');

    setupBookCardEvents(container);
}

/**
 * Configura los eventos para las tarjetas de libro
 */
function setupBookCardEvents(container) {
    container.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-icon')) return;
            const bookId = card.dataset.bookId;
            if (bookId) window.location.href = `/libro-detalle?id=${bookId}`;
        });
    });
}

/**
 * Configura la funcionalidad de búsqueda
 */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) searchBooks(query);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) searchBooks(query);
            }
        });
    }
}

/**
 * Busca libros por término de búsqueda
 */
function searchBooks(query) {
    const searchResultsContainer = document.getElementById('search-results');
    const booksContainer = searchResultsContainer?.querySelector('.search-books-container');
    const categoriesContainer = document.getElementById('categories-container');
    const loadingContainer = document.getElementById('loading-container');
    
    if (!searchResultsContainer || !booksContainer) {
        console.error("Elementos del DOM no encontrados");
        return;
    }

    // Mostrar estado de carga
    booksContainer.innerHTML = '';
    searchResultsContainer.classList.remove('hidden');
    if (categoriesContainer) categoriesContainer.classList.add('hidden');
    if (loadingContainer) loadingContainer.style.display = 'flex';

    // Realizar búsqueda
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            if (loadingContainer) loadingContainer.style.display = 'none';
            
            if (data?.docs?.length > 0) {
                const books = data.docs.map(formatBookData);
                
                // Obtener favoritos si el usuario está autenticado
                if (localStorage.getItem('token')) {
                    return fetch('/api/favorites', {
                        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
                    })
                    .then(res => res.json())
                    .then(favData => {
                        const favoriteIds = (favData.favorites || []).map(fav => fav.bookId);
                        renderBooksWithoutSwiper(books, booksContainer, favoriteIds);
                    })
                    .catch(() => renderBooksWithoutSwiper(books, booksContainer, []));
                } else {
                    renderBooksWithoutSwiper(books, booksContainer, []);
                }
            } else {
                booksContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron resultados para "${query}".</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error en búsqueda:', error);
            if (loadingContainer) loadingContainer.style.display = 'none';
            
            booksContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ha ocurrido un error al buscar. Intente nuevamente.</p>
                </div>
            `;
        });
}

/**
 * Carga los detalles de un libro específico
 */
function loadBookDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (!bookId) {
        showBookError('No se especificó un ID de libro válido.');
        return;
    }
    
    const loadingContainer = document.getElementById('loading-container');
    const bookDetailsContainer = document.getElementById('book-details');
    const errorContainer = document.getElementById('error-container');
    
    // Mostrar estado de carga
    loadingContainer.style.display = 'flex';
    bookDetailsContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';
    
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Cargando detalles del libro...</p>
    `;

    // Obtener detalles del libro
    fetch(`https://openlibrary.org/works/${bookId}.json`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            // Actualizar título de la página
            document.title = `${data.title || 'Libro'} | EmmBook`;
            
            // Portada
            const coverElement = document.getElementById('book-cover');
            if (data.covers?.[0]) {
                coverElement.src = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
                coverElement.onerror = () => coverElement.src = DEFAULT_COVER;
            }

            // Detalles básicos
            document.getElementById('book-title').textContent = data.title || 'Título desconocido';
            document.getElementById('book-publish-date').textContent = 
                data.first_publish_date || 'Fecha desconocida';
            document.getElementById('book-publisher').textContent = 
                data.publishers?.join(', ') || 'Editorial desconocida';

            // ISBN y páginas
            const isbn = data.isbn_13?.[0] || data.isbn_10?.[0] || '-';
            document.getElementById('book-isbn').querySelector('span').textContent = isbn;
            document.getElementById('book-pages').querySelector('span').textContent = data.number_of_pages || '-';

            // Descripción
            const descElement = document.getElementById('book-description-text');
            if (data.description) {
                descElement.textContent = typeof data.description === 'string' 
                    ? data.description 
                    : data.description.value || 'No hay descripción disponible.';
            } else {
                descElement.textContent = 'No hay descripción disponible para este libro.';
            }

            // Categorías
            const subjectsContainer = document.getElementById('book-subjects-list');
            subjectsContainer.innerHTML = '';
            
            if (data.subjects?.length > 0) {
                data.subjects.slice(0, 8).forEach(subject => {
                    const tag = document.createElement('span');
                    tag.className = 'subject-tag';
                    tag.textContent = subject;
                    subjectsContainer.appendChild(tag);
                });
            } else {
                subjectsContainer.innerHTML = '<span class="subject-tag">Sin categorías</span>';
            }
            
            // Link a OpenLibrary
            const openLibraryLink = document.getElementById('open-library-link');
            if (openLibraryLink) {
                openLibraryLink.href = `https://openlibrary.org${data.key}`;
            }

            // Cargar información de autores
            loadAuthors(data.authors);

            // Mostrar contenido
            loadingContainer.style.display = 'none';
            bookDetailsContainer.style.display = 'grid';
        })
        .catch(error => {
            console.error('Error cargando detalles del libro:', error);
            showBookError('No se pudo cargar la información del libro. Intente nuevamente.');
        });
}

/**
 * Carga información de los autores del libro
 */
function loadAuthors(authorRefs) {
    const authorsElement = document.getElementById('book-authors');
    
    if (!authorRefs?.length) {
        authorsElement.textContent = 'Autor desconocido';
        return;
    }
    
    const authorPromises = authorRefs.map(ref => {
        const authorKey = ref.author?.key || ref.key || '';
        if (!authorKey) return Promise.resolve({ name: 'Autor desconocido' });
        
        return fetch(`https://openlibrary.org${authorKey}.json`)
            .then(response => response.json())
            .then(author => ({ name: author.name || 'Autor desconocido' }))
            .catch(() => ({ name: 'Autor desconocido' }));
    });
    
    Promise.all(authorPromises)
        .then(authors => {
            authorsElement.textContent = authors.map(author => author.name).join(', ');
        })
        .catch(error => {
            console.error('Error cargando autores:', error);
            authorsElement.textContent = 'Autor(es) no disponible(s)';
        });
}

/**
 * Muestra un mensaje de error en la página de detalles
 */
function showBookError(message) {
    const loadingContainer = document.getElementById('loading-container');
    const bookDetailsContainer = document.getElementById('book-details');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (bookDetailsContainer) bookDetailsContainer.style.display = 'none';
    
    if (errorContainer) {
        errorContainer.style.display = 'flex';
        if (errorMessage) errorMessage.textContent = message;
    }
}

/**
 * Verifica y marca los libros favoritos en un contenedor
 */
function checkAndMarkFavorites(container = document) {
    if (!localStorage.getItem('token')) return;

    fetch('/api/favorites', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        const favoriteIds = (data.favorites || []).map(fav => fav.bookId);
        
        container.querySelectorAll('.book-card').forEach(card => {
            const bookId = card.dataset.bookId;
            if (bookId) {
                const icon = card.querySelector('.favorite-icon');
                if (icon) icon.classList.toggle('active', favoriteIds.includes(bookId));
            }
        });
    })
    .catch(err => console.error("Error verificando favoritos:", err));
}

/**
 * Añade estilos CSS para los carruseles
 */
function addCarouselStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos base para carruseles */
        .swiper-container {
            width: 100%;
            height: auto;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        
        .swiper-wrapper {
            display: flex;
            width: 100%;
            height: auto;
            padding: 10px 0;
        }
        
        .swiper-slide {
            width: calc(33.333% - 20px);
            height: auto;
            flex-shrink: 0;
        }
        
        .book-card {
            width: 100%;
            height: 100%;
            margin: 0 10px;
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        
        .book-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .book-cover {
            height: 250px;
            position: relative;
            overflow: hidden;
        }
        
        .book-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .favorite-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            color: #ccc;
            font-size: 24px;
            cursor: pointer;
            z-index: 2;
            transition: color 0.2s;
        }
        
        .favorite-icon.active {
            color: gold;
        }
        
        .book-info {
            padding: 15px;
            background: white;
        }
        
        .swiper-button-next,
        .swiper-button-prev {
            color: #007bff;
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            top: 50%;
            transform: translateY(-50%);
        }
        
        .swiper-button-prev { left: 10px; }
        .swiper-button-next { right: 10px; }
        
        /* Responsividad */
        @media (max-width: 992px) {
            .swiper-slide { width: calc(50% - 15px); }
        }
        
        @media (max-width: 576px) {
            .swiper-slide { width: 100%; }
            .swiper-button-next,
            .swiper-button-prev {
                width: 32px;
                height: 32px;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Inicialización al cargar la página
 */
document.addEventListener('DOMContentLoaded', function() {
    // Añadir estilos CSS para carruseles
    addCarouselStyles();
    
    // Configurar página principal si estamos en la home
    if (['/', '/home', ''].includes(window.location.pathname)) {
        setupHomePage();
    }
    
    // Cargar detalles del libro si estamos en la página de detalles
    if (window.location.pathname === '/libro-detalle') {
        loadBookDetails();
    }
});