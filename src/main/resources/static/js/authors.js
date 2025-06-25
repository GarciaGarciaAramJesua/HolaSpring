/**
 * Solución para el problema de autores en búsquedas y favoritos
 */
document.addEventListener('DOMContentLoaded', function() {
    // 1. Mejorar la función formatBookData para manejar diferentes formatos de autor
    const originalFormatBookData = window.formatBookData;
    
    if (typeof originalFormatBookData === 'function') {
        window.formatBookData = function(book) {
            // Llamar a la función original para mantener la base
            const formattedBook = originalFormatBookData(book);
            
            // Mejorar el procesamiento de autores
            formattedBook.authors = extractAuthors(book);
            
            // Registrar para depuración
            console.log(`Libro formateado: ${formattedBook.title}, Autores: ${formattedBook.authors}`);
            
            return formattedBook;
        };
    }
    
    // 2. Función especializada para extraer autores de cualquier formato de libro
    function extractAuthors(book) {
        // Registrar los datos entrantes para depuración
        console.log("Extrayendo autores de:", book);
        
        // Caso 1: Resultados de búsqueda (author_name)
        if (book.author_name && Array.isArray(book.author_name) && book.author_name.length > 0) {
            return book.author_name.join(', ');
        }
        
        // Caso 2: Datos de categoría (authors array de objetos)
        if (book.authors && Array.isArray(book.authors)) {
            // Manejar autores como objetos (categorías) o como strings (ya procesados)
            const authorNames = book.authors.map(author => {
                if (typeof author === 'string') return author;
                return author.name || 'Autor desconocido';
            });
            return authorNames.join(', ');
        }
        
        // Caso 3: Un solo autor como string
        if (book.author && typeof book.author === 'string') {
            return book.author;
        }
        
        // Caso 4: Datos de favoritos (puede venir como 'authors' string)
        if (typeof book.authors === 'string' && book.authors) {
            return book.authors;
        }
        
        // Caso 5: Autor en una clave diferente
        if (book.by_statement) {
            return book.by_statement;
        }
        
        // Si no se encuentra información de autor
        return 'Autor desconocido';
    }
    
    // 3. Mejorar la función searchBooks para procesar correctamente los autores
    const originalSearchBooks = window.searchBooks;
    
    if (typeof originalSearchBooks === 'function') {
        window.searchBooks = function(query) {
            const searchResultsContainer = document.getElementById('search-results');
            const booksContainer = searchResultsContainer?.querySelector('.search-books-container');
            const categoriesContainer = document.getElementById('categories-container');
            const loadingContainer = document.getElementById('loading-container');
            
            // Validar contenedores
            if (!searchResultsContainer || !booksContainer) {
                console.error("Elementos del DOM no encontrados");
                return;
            }
            
            // Mostrar carga
            if (loadingContainer) loadingContainer.style.display = 'flex';
            if (categoriesContainer) categoriesContainer.classList.add('hidden');
            searchResultsContainer.classList.remove('hidden');
            booksContainer.innerHTML = '';
            
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
                    
                    if (loadingContainer) loadingContainer.style.display = 'none';
                    
                    if (data && data.docs && data.docs.length > 0) {
                        // Procesar y formatear los resultados con nuestra función mejorada
                        const books = data.docs.map(doc => {
                            // Registrar libros con autor para depuración
                            if (doc.author_name) {
                                console.log(`Libro encontrado: ${doc.title}, Autores: ${doc.author_name.join(', ')}`);
                            }
                            
                            // Formatear usando nuestra función mejorada
                            return window.formatBookData(doc);
                        });
                        
                        // Obtener IDs de favoritos actuales para marcarlos
                        checkFavoritesAndRender(books, booksContainer);
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
        };
    }
    
    // 4. Función auxiliar para verificar favoritos y renderizar resultados
    function checkFavoritesAndRender(books, container) {
        // Verificar si el usuario está autenticado
        if (!localStorage.getItem('token')) {
            // Si no está autenticado, renderizar sin favoritos
            window.renderBooksWithoutSwiper(books, container, []);
            return;
        }
        
        // Obtener favoritos del usuario
        fetch('/api/favorites', {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const favorites = data.favorites || [];
            const favoriteIds = favorites.map(fav => fav.bookId);
            
            // Renderizar libros con favoritos marcados
            window.renderBooksWithoutSwiper(books, container, favoriteIds);
        })
        .catch(err => {
            console.error("Error obteniendo favoritos:", err);
            // Renderizar sin favoritos en caso de error
            window.renderBooksWithoutSwiper(books, container, []);
        });
    }
    
    // 5. Mejorar la función de renderizado para manejar mejor los autores
    if (typeof window.renderBookCardHTML === 'function') {
        const originalRenderBookCard = window.renderBookCardHTML;
        
        window.renderBookCardHTML = function(book, isFav = false) {
            // Asegurar que tenemos toda la información necesaria
            const safeBook = {
                id: book.id || book.bookId || '',
                title: book.title || book.bookTitle || 'Título desconocido',
                authors: book.authors || 'Autor desconocido',
                coverUrl: book.coverUrl || DEFAULT_COVER,
                coverId: book.coverId || book.bookCoverId || null
            };
            
            // Aplicar la función original con datos seguros
            return originalRenderBookCard(safeBook, isFav);
        };
    }
});