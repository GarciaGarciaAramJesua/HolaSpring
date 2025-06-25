/**
 * Funciones para realizar peticiones a la API
 */

/**
 * Función para realizar peticiones fetch con configuración común
 * @param {string} url - URL de la petición
 * @param {Object} options - Opciones de fetch (method, body, etc)
 * @param {boolean} includeToken - Si se debe incluir el token de autenticación
 * @returns {Promise} - Promesa con la respuesta
 */
async function fetchWithConfig(url, options = {}, includeToken = true) {
    // Definir headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Incluir token si es necesario
    if (includeToken) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            return Promise.reject(new Error('No hay token de autenticación'));
        }
    }
    
    // Configuración completa de la petición
    const fetchOptions = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, fetchOptions);
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            // Obtener más información sobre el error
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.error('Error detallado:', errorData);
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            } else {
                const errorText = await response.text();
                console.error('Error en texto plano:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
            }
        }
        
        // Para respuestas sin contenido (204)
        if (response.status === 204) {
            return null;
        }
        
        // Intentar parsear la respuesta como JSON
        return await response.json();
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

/**
 * Realizar una petición GET
 * @param {string} url - URL de la petición
 * @param {boolean} includeToken - Si se debe incluir el token
 * @returns {Promise} - Promesa con la respuesta
 */
function apiGet(url) {
  // Obtener el token almacenado (esta función debe existir en tu código)
  const token = getToken();
  
  if (!token) {
    console.error('No hay token disponible');
    return Promise.reject('No hay token de autenticación');
  }

  return fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error en la solicitud: ' + response.status);
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error en apiGet:', error);
    throw error;
  });
}

// Asegúrate de tener también esta función para recuperar el token
function getToken() {
  return localStorage.getItem('token'); // O donde sea que lo almacenes
}

/**
 * Realizar una petición POST
 * @param {string} url - URL de la petición
 * @param {Object} data - Datos a enviar
 * @param {boolean} includeToken - Si se debe incluir el token
 * @returns {Promise} - Promesa con la respuesta
 */
function apiPost(url, data, includeToken = true) {
    return fetchWithConfig(url, {
        method: 'POST',
        body: JSON.stringify(data)
    }, includeToken);
}

/**
 * Realizar una petición PUT
 * @param {string} url - URL de la petición
 * @param {Object} data - Datos a enviar
 * @returns {Promise} - Promesa con la respuesta
 */
function apiPut(url, data) {
    return fetchWithConfig(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * Realizar una petición DELETE
 * @param {string} url - URL de la petición
 * @returns {Promise} - Promesa con la respuesta
 */
function apiDelete(url) {
    return fetchWithConfig(url, {
        method: 'DELETE'
    });
}