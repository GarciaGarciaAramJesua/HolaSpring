/**
 * Funciones para administración de usuarios
 */

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
  
  // Cargar lista de usuarios
  getAllUsers()
      .then(users => {
          const usersTable = document.getElementById('users-table');
          users.forEach(user => {
              const row = usersTable.insertRow();
              row.insertCell(0).textContent = user.username;
              row.insertCell(1).textContent = user.firstname;
              row.insertCell(2).textContent = user.lastname;
              row.insertCell(3).textContent = user.country;
              row.insertCell(4).textContent = user.role;
              
              const passwordCell = row.insertCell(5);
              passwordCell.innerHTML = `
                  <div class="password-container">
                      <span>********</span>
                      <i class="fas fa-eye" onclick="togglePasswordVisibility(this)"></i>
                  </div>
              `;
              
              const actionCell = row.insertCell(6);
              actionCell.innerHTML = `
                  <div class="action-buttons">
                      <button onclick="editUser(this)">Editar</button>
                      <button onclick="deleteUser('${user.username}')">Eliminar</button>
                  </div>
              `;
          });
      })
      .catch(error => {
          console.error('Error:', error);
          showToast('Error al cargar los usuarios', 'error');
          setTimeout(() => window.location.href = '/my-profile', 2000);
      });
      
  // Cerrar modal al hacer clic fuera del contenido
  window.onclick = function(event) {
      const modal = document.getElementById('addUserModal');
      if (event.target == modal) {
          closeAddUserModal();
      }
  };
  
  // Configurar formulario de registro
  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
      addUserForm.onsubmit = registerUserFromAdmin;
  }
}