/**
 * Funciones de autenticación (login y registro)
 */

/**
 * Iniciar sesión
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise} - Promesa con el resultado
 */
function login(username, password) {
    return fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }
        return response.json();
    })
    .then(data => {
        // Guardar token
        saveToken(data.token);
        
        // Redireccionar según la URL proporcionada por el backend
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
        } else {
            // Fallback por si no viene URL de redirección
            window.location.href = '/my-profile';
        }
        
        return data;
    });
}

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise} - Promesa con el resultado
 */
function register(userData) {
    return apiPost('/auth/register', userData, false);
}

/**
 * Cerrar sesión
 */
function logout() {
    localStorage.removeItem('token');
    showToast('Sesión cerrada correctamente', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

/**
 * Configurar el formulario de inicio de sesión
 */
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMessage');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            toggleElement(errorMsg, false);
            
            login(username, password)
                .then(() => {
                    // Redirigir a la página de inicio en lugar del perfil
                    window.location.replace('/home');
                })
                .catch(error => {
                    console.error('Error:', error);
                    toggleElement(errorMsg, true);
                });
        });
    }
}

/**
 * Configurar el formulario de registro
 */
function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    const errorMsg = document.getElementById('errorMessage');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const userData = {
                username: document.getElementById('username').value.trim(),
                password: document.getElementById('password').value,
                firstName: document.getElementById('firstname').value.trim(),
                lastName: document.getElementById('lastname').value.trim(),
                country: document.getElementById('country').value.trim(),
                role: "USER" // Valor fijo establecido como "USER"
            };
            
            toggleElement(errorMsg, false);
            
            register(userData)
                .then(() => {
                    window.location.href = '/login';
                })
                .catch(error => {
                    console.error('Error:', error);
                    toggleElement(errorMsg, true);
                });
        });
    }
}

function handleLoginResponse(response) {
  if (response.token) {
    // Guardar token en localStorage
    saveToken(response.token);
    
    // Redireccionar según la respuesta del servidor
    if (response.redirectUrl) {
      window.location.href = response.redirectUrl;
    } else {
      // Fallback si no hay URL de redirección
      window.location.href = '/my-profile';
    }
  } else {
    throw new Error('No se recibió token en la respuesta');
  }
}