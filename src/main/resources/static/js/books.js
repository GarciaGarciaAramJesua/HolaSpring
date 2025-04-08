/**
 * Funciones para manejar libros y la API de  ibrary
 */

// URLs de la API de OpenLibrary
const OPENLIBRARY_API = {
    SEARCH: 'https://openlibrary.org/search.json',
    WORK: 'https://openlibrary.org/works/',
    COVER: 'https://covers.openlibrary.org/b/id/',
    AUTHOR: 'https://openlibrary.org/authors/',
    SUBJECT: 'https://openlibrary.org/subjects/'
};

// Imagen de portada por defecto
const DEFAULT_COVER = '/img/default-cover.jpg';

/**
 * Configura la página principal
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
        toggleElement(loadingContainer, true, 'flex');
    }
    
    // Promise.all para cargar todas las categorías en paralelo
    const promises = [];
    
    categorySections.forEach(section => {
        const category = section.dataset.category;
        const container = section.querySelector('.books-container');
        
        if (category && container) {
            promises.push(
                fetchBooksByCategory(category)
                    .then(books => {
                        renderBooks(books, container);
                    })
                    .catch(error => {
                        console.error(`Error cargando categoría ${category}:`, error);
                        container.innerHTML = `<p class="error-message">No se pudieron cargar los libros de esta categoría.</p>`;
                    })
            );
        }
    });
    
    // Cuando todas las categorías estén cargadas
    Promise.all(promises)
        .then(() => {
            if (loadingContainer) {
                toggleElement(loadingContainer, false);
            }
        })
        .catch(error => {
            console.error('Error cargando categorías:', error);
            if (loadingContainer) {
                toggleElement(loadingContainer, false);
            }
        });
}

/**
 * Obtiene libros por categoría desde OpenLibrary
 * @param {string} category - Categoría a buscar
 * @returns {Promise<Array>} - Libros de esa categoría
 */
function fetchBooksByCategory(category) {
    // Usar https y añadir parámetros adicionales para mejorar la respuesta
    return fetch(`https://openlibrary.org/subjects/${category}.json?limit=6`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Datos recibidos para categoría ${category}:`, data); // Debug log
            if (data && data.works && data.works.length > 0) {
                return data.works.map(formatBookData);
            }
            return [];
        })
        .catch(error => {
            console.error(`Error en fetchBooksByCategory para ${category}:`, error);
            throw error; // Re-lanzar para manejo en el llamador
        });
}

/**
 * Formatea los datos de un libro para su uso en la aplicación
 * @param {Object} book - Datos del libro de la API
 * @returns {Object} - Datos formateados
 */
function formatBookData(book) {
    return {
        id: book.key ? book.key.replace('/works/', '') : null,
        title: book.title || 'Título desconocido',
        authors: book.authors ? book.authors.map(author => author.name || 'Autor desconocido').join(', ') : 'Autor desconocido',
        coverId: book.cover_id || book.cover_i || null,
        coverUrl: book.cover_id || book.cover_i ? 
            `https://covers.openlibrary.org/b/id/${book.cover_id || book.cover_i}-M.jpg` : 
            DEFAULT_COVER,
        publishYear: book.first_publish_year || book.publish_year || 'Año desconocido',
        subjects: book.subject || []
    };
}

/**
 * Renderiza una colección de libros en un contenedor
 * @param {Array} books - Libros a renderizar
 * @param {HTMLElement} container - Contenedor donde renderizar
 */
function renderBooks(books, container) {
    
    if (!books || books.length === 0) {
        container.innerHTML = '<p class="no-results">No se encontraron libros en esta categoría.</p>';
        return;
    }
    
    // Crear el contenedor del carrusel
    const swiperContainer = document.createElement('div');
    swiperContainer.className = 'swiper-container book-carousel';
    
    // Crear el wrapper para las slides
    const swiperWrapper = document.createElement('div');
    swiperWrapper.className = 'swiper-wrapper';
    swiperContainer.appendChild(swiperWrapper);
    
    // Renderizar cada libro como un slide
    books.forEach(book => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        const bookElement = document.createElement('div');
        bookElement.className = 'book-card';
        bookElement.innerHTML = `
            <div class="book-cover">
                <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors}</p>
                <p class="book-year">${book.publishYear}</p>
            </div>
        `;
        
        // Añadir evento click para ver detalles
        bookElement.addEventListener('click', () => {
            window.location.href = `/libro-detalle?id=${book.id}`;
        });
        
        slide.appendChild(bookElement);
        swiperWrapper.appendChild(slide);
    });
    
    // Añadir navegación
    const prevButton = document.createElement('div');
    prevButton.className = 'swiper-button-prev';
    swiperContainer.appendChild(prevButton);
    
    const nextButton = document.createElement('div');
    nextButton.className = 'swiper-button-next';
    swiperContainer.appendChild(nextButton);
    
    // Limpiar el contenedor y añadir el carrusel
    container.innerHTML = '';
    container.appendChild(swiperContainer);
    
    // Inicializar Swiper
    new Swiper(swiperContainer, {
        slidesPerView: 3, // Mostrar solo 3 libros a la vez
        spaceBetween: 25, // Más espacio entre libros
        //centeredSlides: true, // Centrar el slide activo
        navigation: {
            nextEl: nextButton,
            prevEl: prevButton,
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            480: {
                slidesPerView: 2,
                spaceBetween: 25
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 30
            }
            // Eliminar los breakpoints mayores para mantener consistencia
        }
    });
    /*new Swiper(swiperContainer, {
        slidesPerView: 'auto',
        spaceBetween: 20,
        navigation: {
            nextEl: nextButton,
            prevEl: prevButton,
        },
        breakpoints: {
            320: {
                slidesPerView: 2,
                spaceBetween: 10
            },
            480: {
                slidesPerView: 3,
                spaceBetween: 15
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 15
            },
            992: {
                slidesPerView: 5,
                spaceBetween: 20
            }
        }
    });*/
}

/**
 * Configura la funcionalidad de búsqueda
 */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton && searchInput) {
        // Buscar al hacer clic en el botón
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchBooks(query);
            }
        });
        
        // Buscar al presionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    searchBooks(query);
                }
            }
        });
    }
}

/**
 * Busca libros por término de búsqueda
 * @param {string} query - Término de búsqueda
 */
function searchBooks(query) {
    const searchResultsContainer = document.getElementById('search-results');
    const booksContainer = searchResultsContainer.querySelector('.books-container');
    const categoriesContainer = document.getElementById('categories-container');
    const loadingContainer = document.getElementById('loading-container');
    
    // Mostrar carga
    toggleElement(loadingContainer, true, 'flex');
    toggleElement(categoriesContainer, false);
    toggleElement(searchResultsContainer, false);
    
    // Realizar búsqueda
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de búsqueda recibidos:', data); // Debug log
            toggleElement(loadingContainer, false);
            toggleElement(searchResultsContainer, true, 'block');
            
            if (data && data.docs && data.docs.length > 0) {
                const books = data.docs.map(book => ({
                    id: book.key ? book.key.replace('/works/', '') : null,
                    title: book.title || 'Título desconocido',
                    authors: book.author_name ? book.author_name.join(', ') : 'Autor desconocido',
                    coverId: book.cover_i || null,
                    coverUrl: book.cover_i ? 
                        `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 
                        DEFAULT_COVER,
                    publishYear: book.first_publish_year || 'Año desconocido'
                }));
                
                renderBooks(books, booksContainer);
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
            toggleElement(loadingContainer, false);
            toggleElement(searchResultsContainer, true, 'block');
            
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
    console.log("Iniciando carga de detalles del libro");
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (!bookId) {
        showBookError('No se especificó un ID de libro válido.');
        return;
    }
    
    const loadingContainer = document.getElementById('loading-container');
    const bookDetailsContainer = document.getElementById('book-details');
    const errorContainer = document.getElementById('error-container');
    
    loadingContainer.style.display = 'flex';
    bookDetailsContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';
    
    // Animación de carga
    loadingContainer.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Cargando detalles del libro...</p>
    `;

    // Verificar que los elementos existen
    /*if (!loadingContainer || !bookDetailsContainer) {
        console.error("Elementos del DOM no encontrados:", {
            loadingContainer: !!loadingContainer,
            bookDetailsContainer: !!bookDetailsContainer
        });
        return;
    }
    
    // Asegurar que todos los elementos están en su estado inicial
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
    bookDetailsContainer.style.display = 'none';
    loadingContainer.style.display = 'flex';*/
    
    console.log("Solicitando datos del libro con ID:", bookId);
    
    // Obtener detalles del libro
    fetch(`https://openlibrary.org/works/${bookId}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de libro recibidos:', data);
            
            // Ocultar carga y mostrar detalles
            
            // Actualizar el título de la página
            document.title = `${data.title || 'Libro'} | EmmBook`;
            
            // Portada
            const coverElement = document.getElementById('book-cover');
            if (data.covers?.[0]) {
                coverElement.src = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
                coverElement.onerror = () => coverElement.src = '/img/default-cover.jpg';
            }

            // Llenar detalles del libro
            document.getElementById('book-title').textContent = data.title || 'Título desconocido';

            // Autor(es)
            loadAuthors(data.authors);

            if (data.authors?.length > 0) {
                const authors = data.authors.map(a => a.author?.name || 'Autor desconocido').join(', ');
                document.getElementById('book-authors').textContent = authors;
            }
            
            // Fecha y editorial
            document.getElementById('book-publish-date').textContent = 
                data.first_publish_date || 'Fecha desconocida';
            document.getElementById('book-publisher').textContent = 
                data.publishers?.join(', ') || 'Editorial desconocida';

            
            // ISBN y número de páginas
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
 * @param {Array} authorRefs - Referencias a autores
 */
function loadAuthors(authorRefs) {
    const authorsElement = document.getElementById('book-authors');
    
    if (!authorRefs || authorRefs.length === 0) {
        authorsElement.textContent = 'Autor desconocido';
        return;
    }
    
    // Extraer IDs de autores
    const authorPromises = authorRefs.map(ref => {
        const authorKey = ref.author ? ref.author.key : (ref.key || '');
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
 * @param {string} message - Mensaje de error
 */
function showBookError(message) {
    console.log("Mostrando error:", message);
    const loadingContainer = document.getElementById('loading-container');
    const bookDetailsContainer = document.getElementById('book-details');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (bookDetailsContainer) bookDetailsContainer.style.display = 'none';
    
    if (errorContainer) {
        errorContainer.style.display = 'flex';
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    } else {
        console.error("Contenedor de error no encontrado");
    }
}