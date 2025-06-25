/**
 * Funciones relacionadas con la gestión de usuarios
 */

/**
 * Obtener información del usuario actual
 * @returns {Promise} - Promesa con la información
 */
function getUserInfo() {
  return apiGet('/api/info');
}

/**
* Actualizar información del usuario
* @param {Object} userData - Datos actualizados del usuario
* @returns {Promise} - Promesa con el resultado
*/
function updateUserInfo(userData) {
  return apiPut('/api/update', userData);
}

/**
* Configura la página de perfil de usuario
*/
function setupProfilePage() {
  // Estado para guardar los datos originales
  let originalUserData = {};

  // Elementos del DOM
  const form = document.getElementById('update-form');
  const inputs = form.querySelectorAll('input');
  const editBtn = document.getElementById('edit-info');
  const saveBtn = document.getElementById('save-changes');
  const cancelBtn = document.getElementById('cancel-changes');
  const loadingContainer = document.getElementById('loading');
  const profileCard = document.querySelector('.profile-card');

  // Por defecto, todos los campos están deshabilitados
  inputs.forEach(input => {
      input.disabled = true;
  });

  // Ocultar botones de guardar y cancelar
  toggleElement(saveBtn, false);
  toggleElement(cancelBtn, false);

  // Mostrar animación de carga
  toggleElement(loadingContainer, true, 'flex');

  // Cargar información del usuario
  getUserInfo()
      .then(data => {
          // Ocultar animación de carga
          toggleElement(loadingContainer, false);

          const user = data.usuario;
          document.getElementById('welcome-username').textContent = user.username;
          document.getElementById('username-input').value = user.username;
          document.getElementById('firstname').value = user.firstname;
          document.getElementById('lastname').value = user.lastname;
          document.getElementById('country').value = user.country;

          // Guardar datos originales
          originalUserData = {
              username: user.username,
              firstname: user.firstname,
              lastname: user.lastname,
              country: user.country
          };

          // Mostrar animación de entrada
          profileCard.classList.add('fade-in');

          // Mostrar u ocultar botón de administración
          setupAdminButton(user);
      })
      .catch(error => {
          console.error('Error:', error);
          showToast('Error al cargar el perfil', 'error');
          setTimeout(() => {
              window.location.href = '/login';
          }, 2000);
      });

  // Manejador para editar información
  if (editBtn) {
      editBtn.addEventListener('click', () => {
          // Habilitar campos para edición (excepto username)
          inputs.forEach(input => {
              if (input.id !== 'username-input') {
                  input.disabled = false;
              }
          });

          // Mostrar botones de guardar y cancelar, ocultar botón editar
          toggleElement(editBtn, false);
          toggleElement(saveBtn, true, 'inline-flex');
          toggleElement(cancelBtn, true, 'inline-flex');

          // Enfocar primer campo editable
          document.getElementById('firstname').focus();
      });
  }

  // Manejador para cancelar la edición
  if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
          // Restaurar valores originales
          document.getElementById('firstname').value = originalUserData.firstname;
          document.getElementById('lastname').value = originalUserData.lastname;
          document.getElementById('country').value = originalUserData.country;

          // Deshabilitar campos
          inputs.forEach(input => {
              input.disabled = true;
          });

          // Revertir visibilidad de botones
          toggleElement(editBtn, true, 'inline-flex');
          toggleElement(saveBtn, false);
          toggleElement(cancelBtn, false);

          showToast('Edición cancelada');
      });
  }

  // Manejador para enviar el formulario
  if (form) {
      form.addEventListener('submit', event => {
          event.preventDefault();

          // Verificar si estamos en modo edición
          if (saveBtn.style.display === 'none') {
              return;
          }

          const updatedUser = {
              username: document.getElementById('username-input').value,
              firstname: document.getElementById('firstname').value,
              lastname: document.getElementById('lastname').value,
              country: document.getElementById('country').value,
              // Añadimos estos campos para asegurar que el DTO en el backend los reciba siempre
              password: null,
              role: null // El backend asignará el rol actual
          };

          // Mostrar estado de carga
          saveBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';
          saveBtn.disabled = true;
          cancelBtn.disabled = true;

          updateUserInfo(updatedUser)
              .then(data => {
                  // Actualizar datos originales
                  originalUserData = {
                      username: updatedUser.username,
                      firstname: updatedUser.firstname,
                      lastname: updatedUser.lastname,
                      country: updatedUser.country
                  };

                  // Deshabilitar campos
                  inputs.forEach(input => {
                      input.disabled = true;
                  });

                  // Actualizar token si ha cambiado
                  if (data.token) {
                      localStorage.setItem('token', data.token);
                  }

                  // Restaurar botones
                  saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar Cambios';
                  saveBtn.disabled = false;
                  cancelBtn.disabled = false;

                  // Revertir visibilidad de botones
                  toggleElement(editBtn, true, 'inline-flex');
                  toggleElement(saveBtn, false);
                  toggleElement(cancelBtn, false);

                  showToast('Datos actualizados correctamente', 'success');
              })
              .catch(error => {
                  console.error('Error:', error);
                  showToast('Error al actualizar los datos: ' + 
                            (error.message && error.message.includes('Query did not return a unique result') ? 
                             'Problema con roles duplicados. Contacte al administrador.' : 
                             'Error de comunicación con el servidor.'), 
                            'error');

                  // Restaurar botones
                  saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar Cambios';
                  saveBtn.disabled = false;
                  cancelBtn.disabled = false;
              });
      });
  }

  // Configurar botón de cierre de sesión
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
  }

  // Configurar botón de administración
  const adminBtn = document.getElementById('admin-page');
  if (adminBtn) {
      adminBtn.addEventListener('click', () => {
          window.location.href = '/admin/all-users';
      });
  }
}

function setupAdminButton(user) {
    const adminButton = document.getElementById('admin-page');
    
    if (!adminButton) {
        console.error('[setupAdminButton] El botón de administrador no existe en el DOM');
        return;
    }
    
    console.log('[setupAdminButton] Datos del usuario:', user);
    console.log('[setupAdminButton] Rol del usuario:', user.role);
    
    const isAdmin = user.role === 'ROLE_ADMIN';
    console.log('[setupAdminButton] ¿Es admin?', isAdmin);
    
    // Primera aproximación - usando toggleElement
    toggleElement(adminButton, isAdmin, 'flex');
    
    // Segunda aproximación - aplicación directa del estilo (como respaldo)
    setTimeout(() => {
        // Verificar si el botón está visible después de usar toggleElement
        const isVisible = window.getComputedStyle(adminButton).display !== 'none';
        
        if (isAdmin && !isVisible) {
            console.warn('[setupAdminButton] El botón debería estar visible pero no lo está. Forzando visibilidad.');
            adminButton.style.display = 'flex';
            
            // Asegurarse de que ninguna otra propiedad CSS está interfiriendo
            adminButton.style.visibility = 'visible';
            adminButton.style.opacity = '1';
            adminButton.style.height = 'auto';
            adminButton.style.overflow = 'visible';
        }
    }, 200);
    
    // Asegurarse de que el evento click está configurado
    adminButton.addEventListener('click', () => {
        window.location.href = '/admin/all-users';
    });
}