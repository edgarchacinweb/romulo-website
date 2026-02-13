import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  // Token
  const token = localStorage.getItem("auth");

  // Elementos del DOM
  const notificationsContainer = document.getElementById("notifications");
  const firstNameEntry = document.getElementById("nombre");
  const lastNameEntry = document.getElementById("apellido");
  const identityEntry = document.getElementById("cedula");
  const genderEntry = document.getElementById("sexo");
  const emailEntry = document.getElementById("email");
  const submitBtn = document.getElementById("btn-submit");
  const repForm = document.getElementById("repForm");
  const repsList = document.getElementById("repsList");
  const loader = document.createElement("loader-spinner");
  const totalCount = document.getElementById("totalCount");

  // Estado de la aplicación
  let parents = []; // Array local de datos
  let isEditing = false; // Bandera para saber si editamos
  let currentEditId = null; // ID que estamos editando

  // Iconos
  const icons = {
    edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    map: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  };

  // --- FUNCIÓN GLOBAL: CARGAR DATOS EN FORMULARIO (EDITAR) ---
  window.editRep = (usuarioId) => {
    // 1. Buscamos el usuario en el array local
    const parentFound = parents.find(
      (p) => p.UsuarioId == usuarioId || p.id == usuarioId,
    );
    if (!parentFound) return;

    const { DatosPersona, Email } = parentFound;

    // 2. Llenamos los campos del formulario
    firstNameEntry.value = DatosPersona.Nombre;
    lastNameEntry.value = DatosPersona.Apellido;
    identityEntry.value = DatosPersona.Cedula;
    genderEntry.value = DatosPersona.Sexo;
    emailEntry.value = Email;

    // 3. NO BLOQUEAMOS el email
    emailEntry.disabled = false;

    // 4. Cambiamos estado a "Editando"
    isEditing = true;
    currentEditId = DatosPersona.DatosPersonaId || DatosPersona.id;

    // 5. Cambiamos estilo del botón
    submitBtn.textContent = "Actualizar Representante";
    submitBtn.classList.add("btn-warning");
    firstNameEntry.focus();
  };

  // --- FUNCIÓN AUXILIAR: RENDERIZAR LISTA ---
  const renderParents = (parentsData) => {
    repsList.innerHTML = ""; // Limpiar lista actual

    parentsData.forEach((parent) => {
      // Definimos userId dentro del bucle
      const userId = parent.UsuarioId || parent.id;

      const { DatosPersona } = parent;
      const card = document.createElement("article");
      card.className = "rep-card";

      // por si necesitamos el boton de editar en el futuro
      card.innerHTML = `
                <div class="rep-top">
                    <h3>${DatosPersona.Nombre} ${DatosPersona.Apellido}</h3>
                    
                    </div>
                <span class="cedula-text">Cédula: V-${
                  DatosPersona.Cedula
                }</span>

                <div class="rep-details">
                    <div class="detail-item">
                        <span class="icon-blue">${icons.mail}</span>
                        ${parent.Email}
                    </div>
                    <div class="detail-item">
                        <span class="icon-green">${icons.phone}</span>
                        ${
                          !DatosPersona.Telefono
                            ? "No asignado"
                            : DatosPersona.Telefono
                        }
                    </div>
                    <div class="detail-item">
                        <span class="icon-orange">${icons.map}</span>
                        ${
                          !DatosPersona.Direccion
                            ? "No asignado"
                            : DatosPersona.Direccion
                        }
                    </div>
                    <div class="detail-item">
                        <span class="icon-purple">${icons.briefcase}</span>
                        ${
                          !DatosPersona.Ocupacion
                            ? "No asignado"
                            : DatosPersona.Ocupacion
                        }
                    </div>
                </div>

                <div class="rep-footer">
                    Registrado: ${new Date(
                      parent.FechaCreacion || new Date(),
                    ).toLocaleDateString("es-VE")}
                </div>        
            `;
      repsList.appendChild(card);
    });
    totalCount.textContent = parentsData.length;
  };

  // --- CARGA INICIAL DE DATOS ---
  document.body.appendChild(loader);
  try {
    const parentsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/user/filter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Rol: "representante",
        }),
      },
    );

    const parentsData = await parentsResponse.json();
    if (parentsResponse.status !== 200) throw new Error(parentsData.message);

    // Guardamos en variable global y renderizamos
    parents = parentsData;
    renderParents(parents);
  } catch (error) {
    console.log(error);
    const loadNotification = document.createElement("notification-component");
    loadNotification.setAttribute("type", "error");
    loadNotification.setAttribute("text", error);
    notificationsContainer.appendChild(loadNotification);
  } finally {
    loader.remove();
  }

  // --- MANEJO DEL BOTÓN DE ENVÍO (CREAR O EDITAR) ---
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const firstName = firstNameEntry.value.trim();
    const lastName = lastNameEntry.value.trim();
    const identity = identityEntry.value.trim();
    const gender = genderEntry.value;
    const email = emailEntry.value.trim();
    const notification = document.createElement("notification-component");

    document.body.appendChild(loader);

    try {
      // 1. Validaciones
      if (firstName.length === 0) {
        firstNameEntry.focus();
        throw new Error("Debes introducir el nombre del representante");
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(firstName)) {
        firstNameEntry.focus();
        throw new Error("El nombre presenta un formato inválido");
      } else if (lastName.length === 0) {
        lastNameEntry.focus();
        throw new Error("Debes introducir el apellido del representante");
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(lastName)) {
        lastNameEntry.focus();
        throw new Error("El apellido presenta un formato inválido");
      } else if (identity.length === 0) {
        identityEntry.focus();
        throw new Error("Debes introducir la cédula del representante");
      } else if (!/^[1-9]\d{6,9}$/.test(identity)) {
        identityEntry.focus();
        throw new Error(
          "La cédula debe ser mayor a 1 millón (mínimo 7 dígitos)",
        );
      } else if (gender.length === 0) {
        genderEntry.focus();
        throw new Error("Debes indicar el género del representante");
      } else if (email.length === 0) {
        emailEntry.focus();
        throw new Error("Debes indicar el correo electrónico");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEntry.focus();
        throw new Error("El correo electrónico presenta un formato inválido");
      }

      // 2. Lógica: ¿Editar o Crear?
      if (isEditing) {
        // ================= MODO EDICIÓN (PATCH) =================
        const updateResponse = await fetch(
          `${window.APP_CONFIG.api_url}/people/update/${currentEditId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              Nombre: firstName,
              Apellido: lastName,
              Sexo: gender,
              Cedula: identity,
              Email: email,
            }),
          },
        );

        if (updateResponse.status !== 200) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.message || "Error al actualizar");
        }

        notification.setAttribute("type", "success");
        notification.setAttribute("text", "Datos actualizados correctamente");

        // Actualizamos Array Local
        const parentIndex = parents.findIndex(
          (p) =>
            p.DatosPersona.id === currentEditId ||
            p.DatosPersona.DatosPersonaId === currentEditId,
        );

        if (parentIndex !== -1) {
          parents[parentIndex].DatosPersona.Nombre = firstName;
          parents[parentIndex].DatosPersona.Apellido = lastName;
          parents[parentIndex].DatosPersona.Cedula = identity;
          parents[parentIndex].DatosPersona.Sexo = gender;
          parents[parentIndex].Email = email;
        }

        // Resetear estado
        isEditing = false;
        currentEditId = null;
        submitBtn.textContent = "Registrar Representante";
        submitBtn.classList.remove("btn-warning");
      } else {
        // ================= MODO CREACIÓN (POST) =================
        const dataResponse = await fetch(
          `${window.APP_CONFIG.api_url}/people/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              Nombre: firstName,
              Apellido: lastName,
              Sexo: gender,
              Cedula: identity,
            }),
          },
        );

        const peopleData = await dataResponse.json();
        if (dataResponse.status !== 201 && dataResponse.status !== 200)
          throw new Error(peopleData.message);

        const peopleId = peopleData.id;

        const userResponse = await fetch(
          `${window.APP_CONFIG.api_url}/user/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              Email: email,
              Rol: "representante",
              Clave: `V#${identity}`,
              DatosPersonaId: peopleId,
            }),
          },
        );

        const userData = await userResponse.json();
        if (userResponse.status !== 201)
          throw new Error(userData.message || userData);

        notification.setAttribute("type", "success");
        notification.setAttribute(
          "text",
          "Representante registrado correctamente",
        );

        // Agregar al Array Local
        parents.push({
          UsuarioId: userData.id || userData.UsuarioId,
          DatosPersona: {
            id: peopleId,
            DatosPersonaId: peopleId,
            Apellido: lastName,
            Cedula: identity,
            Nombre: firstName,
            Sexo: gender,
          },
          Email: email,
          Rol: "representante",
          FechaCreacion: new Date(),
        });
      }

      // 3. Renderizar y Limpiar
      renderParents(parents);
      repForm.reset();
    } catch (error) {
      console.error(error);
      notification.setAttribute("type", "error");
      notification.setAttribute("text", error.message || error);
    } finally {
      loader.remove();
      notificationsContainer.appendChild(notification);
    }
  });
});
