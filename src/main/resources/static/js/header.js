//Funciones para manejar el header global de la aplicación
//Carga el header global en todas las páginas
function loadGlobalHeader() {
    const headerContainer = document.getElementById('global-header');
    if (!headerContainer) return;

    // Inyectar el HTML del header
    headerContainer.innerHTML = `
        <div class="header-container">
            <div class="header-logo">
                <a href="/home">
                    <i class="fas fa-book-open"></i>
                    <span>EmmBook</span>
                </a>
            </div>
            <div class="header-search">
                <form id="header-search-form">
                    <input type="text" id="header-search-input" placeholder="Buscar libros...">
                    <button type="submit">
                        <i class="fas fa-search"></i>
                    </button>
                </form>
            </div>
            <nav class="header-nav">
                <ul>
                    <li><a href="/home" class="nav-link"><i class="fas fa-home"></i> Home</a></li>
                    <li><a href="/my-profile" class="nav-link"><i class="fas fa-user"></i> Mi Perfil</a></li>
                    <li id="admin-nav-item" style="display:none"><a href="/admin/all-users" class="nav-link"><i class="fas fa-users-cog"></i> Administrar</a></li>
                    <li><a href="#" id="logout-btn" class="nav-link"><i class="fas fa-sign-out-alt"></i> Salir</a></li>
                </ul>
            </nav>
            <div class="header-mobile-toggle">
                <button id="mobile-menu-toggle">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    `;

    // Configurar el botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Verificar si el usuario es admin
    checkAndShowAdminLink();

    // Configurar la búsqueda en el header
    setupHeaderSearch();

    // Configurar menú móvil
    setupMobileMenu();
}

/**
 * Verifica si el usuario es admin y muestra el enlace de administración
 */
function checkAndShowAdminLink() {
    // Obtener información del usuario
    getUserInfo()
        .then(data => {
            const user = data.usuario;
            const adminNavItem = document.getElementById('admin-nav-item');
            // Mostrar el enlace si el usuario es admin
            if (user.role && user.role.name === 'ROLE_ADMIN' && adminNavItem) {
                adminNavItem.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error al verificar rol de usuario:', error);
        });
}

/**
 * Configura la búsqueda en el header
 */
function setupHeaderSearch() {
    const searchForm = document.getElementById('header-search-form');
    const searchInput = document.getElementById('header-search-input');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            
            if (query) {
                // Si estamos en la página de inicio, buscar allí
                if (window.location.pathname === '/home') {
                    // Buscar en la misma página usando la función de books.js
                    searchBooks(query);
                    searchInput.value = '';
                } else {
                    // Redirigir a la página de inicio con el parámetro de búsqueda
                    window.location.href = `/home?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

/**
 * Configura el menú móvil
 */
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');

    if (mobileMenuToggle && headerNav) {
        mobileMenuToggle.addEventListener('click', () => {
            headerNav.classList.toggle('show');
            
            // Cambiar icono según estado
            const icon = mobileMenuToggle.querySelector('i');
            if (headerNav.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}