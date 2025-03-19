document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
  
    fetch(`/api/admin/all-info`, {
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
        const usersTable = document.getElementById("users-table");
        data.forEach((user) => {
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
      .catch((error) => {
        console.error("Error:", error);
        window.location.href = "/view/my-profile";
      });
  });
  
  function togglePasswordVisibility(icon) {
    const passwordContainer = icon.closest(".password-container");
    const passwordSpan = passwordContainer.querySelector("span");
    if (passwordSpan.textContent === "********") {
      // Fetch the actual password from the server (this is just a placeholder)
      passwordSpan.textContent = "actual_password"; // Replace with actual password fetching logic
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordSpan.textContent = "********";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }
  
  function editUser(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td:not(:last-child)");
  
    // Guardar el nombre de usuario original antes de modificar las celdas
    const originalUsername = cells[0].textContent;
  
    cells.forEach((cell, index) => {
      if (index === 4) {
        // Role column
        const select = document.createElement("select");
        const roles = ["USER", "ADMIN"];
        roles.forEach((role) => {
          const option = document.createElement("option");
          option.value = role;
          option.textContent = role;
          if (cell.textContent === role) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        cell.dataset.originalValue = cell.textContent; // Store original value
        cell.textContent = "";
        cell.appendChild(select);
      } else if (index === 5) {
        // Password column
        const input = document.createElement("input");
        input.type = "password";
        input.placeholder = "Nueva contraseña";
        cell.dataset.originalValue = cell.querySelector("span").textContent; // Store original value
        cell.innerHTML = "";
        const passwordContainer = document.createElement("div");
        passwordContainer.className = "password-container";
        passwordContainer.appendChild(input);
        const eyeIcon = document.createElement("i");
        eyeIcon.className = "fas fa-eye";
        eyeIcon.onclick = () => togglePasswordVisibility(eyeIcon);
        passwordContainer.appendChild(eyeIcon);
        cell.appendChild(passwordContainer);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = cell.textContent;
        cell.dataset.originalValue = cell.textContent; // Store original value
        cell.textContent = "";
        cell.appendChild(input);
      }
    });
  
    const actionButtons = row.querySelector(".action-buttons");
    actionButtons.innerHTML = `
      <button onclick="saveUser(this, '${originalUsername}')">Guardar</button>
      <button onclick="cancelEdit(this)">Cancelar</button>
    `;
  }
  
  function saveUser(button, originalUsername) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td:not(:last-child)");
    const token = localStorage.getItem("token");
  
    const updatedUserDto = {
      username: cells[0].querySelector("input").value,
      firstname: cells[1].querySelector("input").value,
      lastname: cells[2].querySelector("input").value,
      country: cells[3].querySelector("input").value,
      role: cells[4].querySelector("select").value, // Solo envía el nombre del rol
      password: cells[5].querySelector("input").value || null,
    };
  
    fetch(`/api/admin/update/${originalUsername}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUserDto),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la actualización");
        }
        return response.json();
      })
      .then((data) => {
        cells.forEach((cell, index) => {
          if (index === 4) {
            // Role column
            const select = cell.querySelector("select");
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
            const input = cell.querySelector("input");
            cell.textContent = input.value;
          }
        });
        const actionButtons = row.querySelector(".action-buttons");
        actionButtons.innerHTML = `
          <button onclick="editUser(this)">Editar</button>
          <button onclick="deleteUser('${updatedUserDto.username}')">Eliminar</button>
        `;
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("No se pudo actualizar el usuario. Verifique los datos.");
      });
  }
  
  function cancelEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td:not(:last-child)");
    cells.forEach((cell) => {
      cell.textContent = cell.dataset.originalValue; // Restore original value
    });
  
    const actionButtons = row.querySelector(".action-buttons");
    actionButtons.innerHTML = `
      <button onclick="editUser(this)">Editar</button>
      <button onclick="deleteUser('${cells[0].textContent}')">Eliminar</button>
    `;
  }
  
  function deleteUser(username) {
    const token = localStorage.getItem("token");
    fetch(`/api/admin/delete/${username}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("No autorizado");
        location.reload();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  
  // Función para mostrar el modal de añadir usuario
  function showAddUserModal() {
    document.getElementById("addUserModal").style.display = "block";
  }
  
  // Función para cerrar el modal
  function closeAddUserModal() {
    document.getElementById("addUserModal").style.display = "none";
    // Limpiar el formulario
    document.getElementById("addUserForm").reset();
  }
  
  // Función para registrar un nuevo usuario
  function registerUser(event) {
    event.preventDefault();
  
    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newPassword").value;
    const firstName = document.getElementById("newFirstName").value;
    const lastName = document.getElementById("newLastName").value;
    const country = document.getElementById("newCountry").value;
    const role = document.getElementById("newRole").value;
  
    const registerRequest = {
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      country: country,
      role: role,
    };
  
    fetch(`/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(registerRequest),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text || "Error al registrar usuario");
          });
        }
        return response;
      })
      .then(() => {
        alert("Usuario registrado exitosamente");
        closeAddUserModal();
        location.reload(); // Recargar la página para mostrar el nuevo usuario
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error al registrar usuario: " + error.message);
      });
  }
  
  // Cerrar modal al hacer clic fuera del contenido
  window.onclick = function (event) {
    const modal = document.getElementById("addUserModal");
    if (event.target == modal) {
      closeAddUserModal();
    }
  };
  
  // Función para alternar la visibilidad de la contraseña en el formulario de registro
  function toggleNewPasswordVisibility(icon) {
    const passwordInput = document.getElementById("newPassword");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }