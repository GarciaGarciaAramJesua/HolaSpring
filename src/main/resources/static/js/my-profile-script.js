document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
  
    // Estado para guardar los datos originales
    let originalUserData = {};
  
    // Elementos del DOM
    const form = document.getElementById("update-form");
    const inputs = form.querySelectorAll("input");
    const editBtn = document.getElementById("edit-info");
    const saveBtn = document.getElementById("save-changes");
    const cancelBtn = document.getElementById("cancel-changes");
  
    // Por defecto, todos los campos están deshabilitados
    inputs.forEach((input) => {
      input.disabled = true;
    });
  
    // Ocultar botones de guardar y cancelar
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
  
    // Mostrar animación de carga
    document.getElementById("loading").style.display = "flex";
  
    // Realiza la petición al nuevo endpoint para obtener la información del usuario
    fetch(`/api/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("No autorizado");
        return response.json();
      })
      .then((data) => {
        // Ocultar animación de carga
        document.getElementById("loading").style.display = "none";
  
        const user = data.usuario;
        document.getElementById("welcome-username").textContent =
          user.username;
        document.getElementById("username-input").value = user.username;
        document.getElementById("firstname").value = user.firstname;
        document.getElementById("lastname").value = user.lastname;
        document.getElementById("country").value = user.country;
  
        // Guardar datos originales para poder cancelar cambios
        originalUserData = {
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          country: user.country,
        };
  
        // Añadir clase para animación
        document.querySelector(".profile-card").classList.add("fade-in");
  
        // Mostrar u ocultar el botón "Administrar Usuarios" según el rol del usuario
        if (user.role.name === "ROLE_ADMIN") {
          document.getElementById("admin-page").style.display = "flex";
        } else {
          document.getElementById("admin-page").style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showToast("Error al cargar el perfil", "error");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      });
  
    // Manejar el cierre de sesión
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("token");
      showToast("Sesión cerrada correctamente", "success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    });
  
    // Manejar el botón de editar información
    editBtn.addEventListener("click", () => {
      // Habilitar los campos para edición
      inputs.forEach((input) => {
        // No permitir editar el nombre de usuario
        if (input.id !== "username-input") {
          input.disabled = false;
        }
      });
  
      // Mostrar botones de guardar y cancelar, ocultar botón editar
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-flex";
      cancelBtn.style.display = "inline-flex";
  
      // Enfocar el primer campo editable
      document.getElementById("firstname").focus();
    });
  
    // Manejar el botón de cancelar
    cancelBtn.addEventListener("click", () => {
      // Restaurar los valores originales
      document.getElementById("firstname").value =
        originalUserData.firstname;
      document.getElementById("lastname").value = originalUserData.lastname;
      document.getElementById("country").value = originalUserData.country;
  
      // Deshabilitar campos
      inputs.forEach((input) => {
        input.disabled = true;
      });
  
      // Ocultar botones de guardar y cancelar, mostrar botón editar
      editBtn.style.display = "inline-flex";
      saveBtn.style.display = "none";
      cancelBtn.style.display = "none";
  
      showToast("Edición cancelada", "default");
    });
  
    // Manejar la actualización de los datos del usuario
    form.addEventListener("submit", (event) => {
      event.preventDefault();
  
      // Verificar si estamos en modo edición (los botones de guardar y cancelar están visibles)
      if (saveBtn.style.display === "none") {
        return; // No estamos en modo edición, no hacer nada
      }
  
      const updatedUser = {
        username: document.getElementById("username-input").value,
        firstname: document.getElementById("firstname").value,
        lastname: document.getElementById("lastname").value,
        country: document.getElementById("country").value,
      };
  
      // Mostrar botón en estado de carga
      saveBtn.innerHTML =
        '<span class="loading-spinner"></span> Guardando...';
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
  
      fetch(`/api/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error("Error al actualizar los datos");
          return response.json();
        })
        .then((data) => {
          // Actualizar datos originales
          originalUserData = {
            username: updatedUser.username,
            firstname: updatedUser.firstname,
            lastname: updatedUser.lastname,
            country: updatedUser.country,
          };
  
          // Deshabilitar campos
          inputs.forEach((input) => {
            input.disabled = true;
          });
  
          // Restaurar botones
          saveBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar Cambios';
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
  
          // Ocultar botones de guardar y cancelar, mostrar botón editar
          editBtn.style.display = "inline-flex";
          saveBtn.style.display = "none";
          cancelBtn.style.display = "none";
  
          showToast("Datos actualizados correctamente", "success");
        })
        .catch((error) => {
          console.error("Error:", error);
          showToast("Error al actualizar los datos", "error");
  
          saveBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Guardar Cambios';
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
        });
    });
  
    // Añadir el manejo del botón para navegar a /view/admin/all-users
    document.getElementById("admin-page").addEventListener("click", () => {
      window.location.href = "/view/admin/all-users";
    });
  
    // Función para mostrar notificaciones toast
    window.showToast = function (message, type = "default") {
      const toast = document.createElement("div");
      toast.className = `toast ${type}`;
      toast.textContent = message;
  
      document.body.appendChild(toast);
  
      // Forzar un reflow para que la transición funcione
      toast.offsetHeight;
  
      toast.classList.add("show");
  
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    };
  });