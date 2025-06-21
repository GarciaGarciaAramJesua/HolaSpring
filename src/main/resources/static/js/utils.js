/**
 * Utilidades y funciones auxiliares
 */

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'default'
 * @param {number} duration - Duración en milisegundos
 */
function showToast(message, type = 'default', duration = 3000) {
    // Eliminar toast existente si lo hay
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Forzar un reflow para que la transición funcione
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @returns {string|null} - Mensaje de error o null si es válido
 */
function validateRequired(value, fieldName) {
    return value ? null : `El campo ${fieldName} es obligatorio`;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'El correo electrónico no tiene un formato válido';
}

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {string|null} - Mensaje de error o null si es válido
 */
function validatePassword(password) {
    return password.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres';
}

/**
 * Función para mostrar/ocultar un elemento del DOM
 * @param {HTMLElement} element - Elemento a mostrar u ocultar
 * @param {boolean} show - true para mostrar, false para ocultar
 * @param {string} displayType - Tipo de display a usar
 */
function toggleElement(element, show, displayType = 'block') {
    if (element) {
        element.style.display = show ? displayType : 'none';
    }
}

/**
 * Crear un elemento de carga
 * @param {string} message - Mensaje a mostrar junto al spinner
 * @returns {HTMLElement} - Elemento de carga
 */
function createLoadingElement(message = 'Cargando...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-container';
    loadingDiv.style.display = 'flex';
    
    loadingDiv.innerHTML = `
        <div style="text-align: center">
            <div class="loading-spinner-container"></div>
            <p style="margin-top: 10px; color: var(--primary-color)">${message}</p>
        </div>
    `;
    
    return loadingDiv;
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} - true si está autenticado
 */
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

/**
 * Redireccionar si no está autenticado
 * @param {string} redirectUrl - URL a la que redireccionar
 */
function redirectIfNotAuthenticated(redirectUrl = '/login') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
    }
}

function renderBookCardHTML(book, isFav = false) {
    return `
        <div class="book-card" data-book-id="${book.id}" onclick="window.location.href='/libro-detalle?id=${book.id}'">
            <div class="book-cover">
                <img src="${book.coverUrl}" alt="${book.title}" onerror="this.src='${DEFAULT_COVER}'">
                <span class="favorite-icon${isFav ? ' active' : ''}" 
                    title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                    onclick="event.stopPropagation(); toggleFavorite('${book.id}', ${isFav}, this)">
                    <i class="fas fa-star"></i>
                </span>
            </div>
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.authors}</p>
            </div>
        </div>
    `;
}

// books.js o utils.js
function showNotification(message, duration = 2000) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.textContent = message;
    notif.classList.add('show');
    setTimeout(() => {
        notif.classList.remove('show');
    }, duration);
}