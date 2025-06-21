// Marcar/desmarcar favorito (asume autenticación JWT en localStorage)

function toggleFavorite(bookId, isFavorite, iconElement) {
    const method = isFavorite ? "DELETE" : "POST";
    
    // Crear el objeto que el backend espera para POST
    const requestOptions = {
        method: method,
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
        }
    };
    
    // Solo para POST añadimos el body con el FavoriteRequest
    if (method === "POST") {
        requestOptions.body = JSON.stringify({
            bookId: bookId,
            bookTitle: document.querySelector(`[data-book-id="${bookId}"] h3`)?.textContent || "Título desconocido",
            // Si el backend necesita más campos, agrégalos aquí
        });
    }
    
    // Realizar la solicitud
    fetch(`/api/favorites/${bookId}`, requestOptions)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `Error ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Actualizar UI: cambiar icono
            if (iconElement) iconElement.classList.toggle('active', !isFavorite);
            
            showNotification(isFavorite ? "Eliminado de favoritos" : "Agregado a favoritos");
            
            // Recargar favoritos para reflejar el cambio
            loadFavorites();
            
            // Notificar a las recomendaciones que actualicen
            if (typeof triggerFavoritesChange === 'function') {
                triggerFavoritesChange();
            }
        })
        .catch(error => {
            console.error('Error en toggleFavorite:', error);
            showNotification("No se pudo actualizar el favorito: " + error.message, 3000);
        });
}

// Instalar la función corregida cuando se cargue el documento
document.addEventListener('DOMContentLoaded', function() {
    window.toggleFavorite = toggleFavorite;
});

function loadFavorites() {
    fetch('/api/favorites', {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => res.json()).then(console.log)
    .then(favoriteBooks => {
        // Actualiza la UI para mostrar qué libros son favoritos
        // Actualiza iconos solo en el contenedor de favoritos
        const favContainer = document.getElementById('favorites-books-container');
        // Por ejemplo, pone el icono de estrella en los favoritos
        if (favContainer) {
            favContainer.querySelectorAll('.book-card').forEach(card => {
                const bid = card.dataset.bookId;
                const favIcon = card.querySelector('.favorite-icon');
                if (favIcon) {
                    favIcon.classList.toggle('active', favoriteBooks.includes(bid));
                }
            });
        } else{
            return;
        }
        // Renderiza los libros favoritos
        renderFavorites(favoriteBooks);
        /*if (!favoriteBooks || favoriteBooks.length === 0) {
            favContainer.innerHTML = '<p class="no-results">No tienes libros favoritos.</p>';
            return;
        }
        favContainer.innerHTML = favoriteBooks.map(book => renderBookCardHTML(book, true)).join('');*/
    });
}

function renderFavorites(books) {
    const favContainer = document.getElementById('favorites-books-container');
    if (!favContainer) return;
    if (!books || books.length === 0) {
        favContainer.innerHTML = '<p class="no-results">No tienes libros favoritos.</p>';
        return;
    }
    favContainer.innerHTML = books.map(book => renderBookCardHTML({
        id: book.bookId,
        title: book.title,
        authors: book.authors, // ajusta si necesitas convertir string a array
        coverUrl: book.bookId ? `https://covers.openlibrary.org/b/olid/${book.bookId}-M.jpg` : DEFAULT_COVER,
        isFavorite: true,
    }, true)).join('');
}

/*
async function loadFavorites() {
    const res = await fetch('/api/favorites', {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    const favoriteBookIds = Array.isArray(data) ? data : data.favorites;
    if (!favoriteBookIds || favoriteBookIds.length === 0) {
        renderFavorites([]);
        return;
    }
    const books = await Promise.all(favoriteBookIds.map(async bookId => {
        try {
            const res = await fetch(`https://openlibrary.org/works/${bookId}.json`);
            const book = await res.json();
            return formatBookData(book);
        } catch (e) {
            return null;
        }
    }));
    renderFavorites(books.filter(Boolean));
}*/


/*function renderFavorites(books) {
    const favContainer = document.getElementById('favorites-books-container');
    if (!favContainer) return;
    if (!books || books.length === 0) {
        favContainer.innerHTML = '<p class="no-results">No tienes libros favoritos.</p>';
        return;
    }
    favContainer.innerHTML = books.map(book => renderBookCardHTML(book, true)).join('');
}*/

// Mostrar recomendaciones en la home
function loadRecommendations() {
    fetch('/api/favorites/recommendations', {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => res.json())
    .then(recommendations => {
        const container = document.getElementById('recommendations-container');
        container.innerHTML = '';
        if (!recommendations.length) {
            container.innerHTML = '<p>No hay recomendaciones por ahora. ¡Agrega libros a tus favoritos!</p>';
            return;
        }
        // Asegúrate de formatear los datos igual que en books.js
        const books = recommendations.map(formatBookData);
        container.innerHTML = books.map(book => renderBookCardHTML(book, false)).join('');
    })
    .catch(() => {
        const container = document.getElementById('recommendations-container');
        container.innerHTML = '<p>Error cargando recomendaciones.</p>';
    });
}