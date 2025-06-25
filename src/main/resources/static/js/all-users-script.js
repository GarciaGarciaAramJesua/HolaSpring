/**
 * Funciones para administración de usuarios
 */

function handleLogin(response) {
    // Guardar el token
    saveToken(response.token);
    
    // Redireccionar según la respuesta del servidor
    if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
    } else {
        window.location.href = '/my-profile'; // Fallback
    }
}

/**
 * Obtener lista de todos los usuarios
 * @returns {Promise} - Promesa con la lista de usuarios
 */
function getAllUsers() {
  return apiGet('/api/admin/all-info');
}

/**
* Actualizar un usuario como administrador
* @param {string} username - Nombre de usuario a actualizar
* @param {Object} userData - Datos actualizados
* @returns {Promise} - Promesa con el resultado
*/
function updateUserByAdmin(username, userData) {
  return apiPut(`/api/admin/update/${username}`, userData);
}

/**
* Eliminar un usuario
* @param {string} username - Nombre de usuario a eliminar
* @returns {Promise} - Promesa con el resultado
*/
function deleteUserByAdmin(username) {
  return apiDelete(`/api/admin/delete/${username}`);
}

/**
* Alternar la visibilidad de la contraseña
* @param {HTMLElement} icon - Icono que se ha pulsado
*/
function togglePasswordVisibility(icon) {
  const passwordContainer = icon.closest('.password-container');
  const passwordSpan = passwordContainer.querySelector('span');
  
  if (passwordSpan.textContent === '********') {
      // En un entorno real esto no se haría, pero para la demo:
      passwordSpan.textContent = 'actual_password'; 
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
  } else {
      passwordSpan.textContent = '********';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
  }
}

/**
* Alternar la visibilidad de la contraseña en el formulario de nuevo usuario
* @param {HTMLElement} icon - Icono que se ha pulsado
*/
function toggleNewPasswordVisibility(icon) {
  const passwordInput = document.getElementById('newPassword');
  if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
  } else {
      passwordInput.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
  }
}

/**
* Configurar funcionalidad para editar usuario
* @param {HTMLElement} button - Botón de edición pulsado
*/
function editUser(button) {
  const row = button.closest('tr');
  const cells = row.querySelectorAll('td:not(:last-child)');

  // Guardar el nombre de usuario original antes de modificar las celdas
  const originalUsername = cells[0].textContent;

  cells.forEach((cell, index) => {
      if (index === 4) {
          // Role column
          const select = document.createElement('select');
          const roles = ['USER', 'ADMIN'];
          roles.forEach(role => {
              const option = document.createElement('option');
              option.value = role;
              option.textContent = role;
              if (cell.textContent === role) {
                  option.selected = true;
              }
              select.appendChild(option);
          });
          cell.dataset.originalValue = cell.textContent; // Store original value
          cell.textContent = '';
          cell.appendChild(select);
      } else if (index === 5) {
          // Password column
          const input = document.createElement('input');
          input.type = 'password';
          input.placeholder = 'Nueva contraseña';
          cell.dataset.originalValue = cell.querySelector('span').textContent; // Store original value
          cell.innerHTML = '';
          const passwordContainer = document.createElement('div');
          passwordContainer.className = 'password-container';
          passwordContainer.appendChild(input);
          const eyeIcon = document.createElement('i');
          eyeIcon.className = 'fas fa-eye';
          eyeIcon.onclick = () => togglePasswordVisibility(eyeIcon);
          passwordContainer.appendChild(eyeIcon);
          cell.appendChild(passwordContainer);
      } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = cell.textContent;
          cell.dataset.originalValue = cell.textContent; // Store original value
          cell.textContent = '';
          cell.appendChild(input);
      }
  });

  const actionButtons = row.querySelector('.action-buttons');
  actionButtons.innerHTML = `
      <button onclick="saveUser(this, '${originalUsername}')">Guardar</button>
      <button onclick="cancelEdit(this)">Cancelar</button>
  `;
}

/**
* Guardar cambios en un usuario editado
* @param {HTMLElement} button - Botón de guardar pulsado
* @param {string} originalUsername - Nombre de usuario original
*/
function saveUser(button, originalUsername) {
  const row = button.closest('tr');
  const cells = row.querySelectorAll('td:not(:last-child)');
  
  const updatedUserDto = {
      username: cells[0].querySelector('input').value,
      firstname: cells[1].querySelector('input').value,
      lastname: cells[2].querySelector('input').value,
      country: cells[3].querySelector('input').value,
      role: cells[4].querySelector('select').value,
      password: cells[5].querySelector('input').value || null,
  };

  updateUserByAdmin(originalUsername, updatedUserDto)
      .then(data => {
          cells.forEach((cell, index) => {
              if (index === 4) {
                  // Role column
                  const select = cell.querySelector('select');
                  cell.textContent = select.value;
              } else if (index === 5) {
                  // Password column
                  cell.innerHTML = `
                      <div class="password-container">
                          <span>********</span>
                          <i class="fas fa-eye" onclick="togglePasswordVisibility(this)"></i>
                      </div>
                  `;
              } else {
                  const input = cell.querySelector('input');
                  cell.textContent = input.value;
              }
          });
          const actionButtons = row.querySelector('.action-buttons');
          actionButtons.innerHTML = `
              <button onclick="editUser(this)">Editar</button>
              <button onclick="deleteUser('${updatedUserDto.username}')">Eliminar</button>
          `;
          
          showToast('Usuario actualizado correctamente', 'success');
      })
      .catch(error => {
          console.error('Error:', error);
          showToast('No se pudo actualizar el usuario', 'error');
      });
}

/**
* Cancelar la edición de un usuario
* @param {HTMLElement} button - Botón de cancelar pulsado
*/
function cancelEdit(button) {
  const row = button.closest('tr');
  const cells = row.querySelectorAll('td:not(:last-child)');
  
  cells.forEach((cell, index) => {
      if (index === 5) {
          // Password column - special case
          cell.innerHTML = `
              <div class="password-container">
                  <span>********</span>
                  <i class="fas fa-eye" onclick="togglePasswordVisibility(this)"></i>
              </div>
          `;
      } else {
          cell.textContent = cell.dataset.originalValue; // Restore original value
      }
  });

  const actionButtons = row.querySelector('.action-buttons');
  actionButtons.innerHTML = `
      <button onclick="editUser(this)">Editar</button>
      <button onclick="deleteUser('${cells[0].textContent}')">Eliminar</button>
  `;
  
  showToast('Edición cancelada');
}

/**
* Eliminar un usuario
* @param {string} username - Nombre de usuario a eliminar
*/
function deleteUser(username) {
  if (confirm(`¿Está seguro de que desea eliminar al usuario "${username}"?`)) {
      deleteUserByAdmin(username)
          .then(() => {
              showToast(`Usuario "${username}" eliminado correctamente`, 'success');
              setTimeout(() => location.reload(), 1000);
          })
          .catch(error => {
              console.error('Error:', error);
              showToast('No se pudo eliminar el usuario', 'error');
          });
  }
}

/**
* Mostrar el modal para añadir un usuario
*/
function showAddUserModal() {
  document.getElementById('addUserModal').style.display = 'block';
}

/**
* Cerrar el modal para añadir un usuario
*/
function closeAddUserModal() {
  document.getElementById('addUserModal').style.display = 'none';
  document.getElementById('addUserForm').reset();
}

/**
* Registrar un nuevo usuario desde el panel de administración
* @param {Event} event - Evento de submit
*/
function registerUserFromAdmin(event) {
  event.preventDefault();
  
  const registerRequest = {
      username: document.getElementById('newUsername').value,
      password: document.getElementById('newPassword').value,
      firstName: document.getElementById('newFirstName').value,
      lastName: document.getElementById('newLastName').value,
      country: document.getElementById('newCountry').value,
      role: document.getElementById('newRole').value,
  };

  register(registerRequest)
      .then(() => {
          showToast('Usuario registrado correctamente', 'success');
          closeAddUserModal();
          setTimeout(() => location.reload(), 1000);
      })
      .catch(error => {
          console.error('Error:', error);
          showToast(`Error al registrar usuario: ${error.message}`, 'error');
      });
}

/**
* Configurar página de administración de usuarios
*/
function setupAdminPage() {
  // Redireccionar si no está autenticado
  redirectIfNotAuthenticated();
  
  console.log('Comenzando carga de usuarios...');
  
  // Verificar token
  const token = getToken();
  console.log('Token disponible:', !!token); // No mostrar el token completo por seguridad
  
  // Cargar lista de usuarios
  getAllUsers()
      .then(users => {
          console.log('Usuarios recibidos:', users);
          
          if (!users || users.length === 0) {
              console.log('No se recibieron usuarios o la lista está vacía');
              // Añadir mensaje a la tabla
              const usersTable = document.getElementById('users-table');
              const row = usersTable.insertRow();
              const cell = row.insertCell(0);
              cell.colSpan = 7;
              cell.textContent = 'No hay usuarios disponibles';
              return;
          }
          
          const usersTable = document.getElementById('users-table');
          users.forEach(user => {
              const row = usersTable.insertRow();
              row.insertCell(0).textContent = user.username;
              row.insertCell(1).textContent = user.firstname;
              row.insertCell(2).textContent = user.lastname;
              row.insertCell(3).textContent = user.country;
              row.insertCell(4).textContent = user.role;
              
              // Resto del código...
          });
      })
      .catch(error => {
          console.error('Error detallado:', error);
          // Mostrar error en la UI para depuración
          const errorDiv = document.createElement('div');
          errorDiv.style.color = 'red';
          errorDiv.style.padding = '20px';
          errorDiv.textContent = `Error: ${error.message || error}`;
          document.body.appendChild(errorDiv);
          
          showToast('Error al cargar los usuarios', 'error');
      });
}

// Mejorar la función de API
function apiGet(url) {
  const token = getToken();
  if (!token) {
    console.error('No hay token disponible');
    return Promise.reject('No hay token de autenticación');
  }

  console.log('Haciendo solicitud a:', url);
  
  return fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Respuesta recibida:', response.status);
    if (!response.ok) {
      return response.text().then(text => {
        console.error('Error en la respuesta:', text);
        throw new Error(`Error ${response.status}: ${text}`);
      });
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error en apiGet:', error);
    throw error;
  });
}