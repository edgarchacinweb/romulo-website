import authorize from "./auth.js";
import { formatCedula } from "./utils.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  // Token
  const token = localStorage.getItem("auth");

  // Elementos del DOM
  const notificationsContainer = document.getElementById("notifications");
  const firstNameEntry = document.getElementById("nombre");
  const lastNameEntry = document.getElementById("apellido");
  
  // ELEMENTOS DE CÉDULA
  const identityEntry = document.getElementById("cedula"); // El input de números
  const typeIdEntry = document.getElementById("tipo-cedula"); // El selector V/E
  
  const genderEntry = document.getElementById("sexo");
  const emailEntry = document.getElementById("email");
  const submitBtn = document.getElementById("btn-submit");
  const repForm = document.getElementById("repForm");
  const repsList = document.getElementById("repsList");
  const loader = document.createElement("loader-spinner");
  const totalCount = document.getElementById("totalCount");
  const searchInput = document.getElementById("searchInput"); // Elemento de Búsqueda

  // Estado de la aplicación
  let parents = []; 
  let isEditing = false; 
  let currentEditId = null; 
  let currentSearchQuery = ""; // Control de búsqueda actual
  
  // --- VALIDACIÓN EN TIEMPO REAL: CÉDULA (SOLO NÚMEROS) ---
  if (identityEntry) {
    identityEntry.addEventListener("input", function() {
      this.value = this.value.replace(/\D/g, "");
    });
  }

  // Iconos
  const icons = {
    edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    map: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  };

  // --- FUNCIÓN GLOBAL: CANCELAR EDICIÓN ---
  window.cancelEdit = () => {
    isEditing = false;
    currentEditId = null;
    repForm.reset();
    if(typeIdEntry) typeIdEntry.value = "V";
    
    // Restaurar el botón original
    submitBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Registrar Representante`;
    submitBtn.classList.remove("btn-warning");

    const cancelBtn = document.getElementById("btn-cancel-edit");
    if (cancelBtn) cancelBtn.remove();
  };

  // --- FUNCIÓN GLOBAL: CARGAR DATOS EN FORMULARIO (EDITAR) ---
  window.editRep = (usuarioId) => {
    const parentFound = parents.find(
      (p) => p.UsuarioId == usuarioId || p.Usuario?.UsuarioId == usuarioId
    );
    if (!parentFound) return;

    const { DatosPersona, Email } = parentFound;
    let cedulaCompleta = DatosPersona.Cedula.toString();

    // 1. Detectar si es extranjero para ajustar el selector
    if (cedulaCompleta.toUpperCase().startsWith("E")) {
        typeIdEntry.value = "E";
        identityEntry.value = cedulaCompleta.substring(1); 
    } else {
        typeIdEntry.value = "V";
        identityEntry.value = cedulaCompleta; 
    }

    firstNameEntry.value = DatosPersona.Nombre;
    lastNameEntry.value = DatosPersona.Apellido;
    genderEntry.value = DatosPersona.Sexo;
    emailEntry.value = Email;

    emailEntry.disabled = false;

    isEditing = true;
    currentEditId = DatosPersona.DatosPersonaId;

    submitBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Actualizar Representante`;
    submitBtn.classList.add("btn-warning");
    
    // Crear el botón de cancelar si no existe
    if (!document.getElementById("btn-cancel-edit")) {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.id = "btn-cancel-edit";
      cancelBtn.textContent = "Cancelar Edición";
      cancelBtn.style.marginTop = "10px";
      cancelBtn.style.width = "100%";
      cancelBtn.style.padding = "0.75rem";
      cancelBtn.style.borderRadius = "6px";
      cancelBtn.style.border = "1px solid #d1d5db";
      cancelBtn.style.background = "#f3f4f6";
      cancelBtn.style.cursor = "pointer";
      cancelBtn.style.fontWeight = "bold";
      cancelBtn.onclick = cancelEdit;
      repForm.appendChild(cancelBtn);
    }

    firstNameEntry.focus();
    // Scroll arriba para móvil
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDERIZAR LISTA ---
  const renderParents = (parentsData) => {
    repsList.innerHTML = ""; 

    if(parentsData.length === 0) {
      repsList.innerHTML = `<p style="text-align:center; color:#666; width:100%; grid-column: 1 / -1;">No se encontraron representantes.</p>`;
    }

    parentsData.forEach((parent) => {
      const userId = parent.UsuarioId;
      const { DatosPersona } = parent;
      
      // 2. Formateo visual inteligente
      let displayCedula = formatCedula(DatosPersona.Cedula);

      const card = document.createElement("article");
      card.className = "rep-card";

      // El botón de edición ahora está habilitado
      card.innerHTML = `
                <div class="rep-top">
                    <h3>${DatosPersona.Nombre} ${DatosPersona.Apellido}</h3>
                    <button class="btn-edit" onclick="editRep('${userId}')" title="Editar" style="cursor: pointer; background: transparent; border: none; color: #4b5563;">
                        ${icons.edit}
                    </button> 
                </div>
                <span class="cedula-text">Cédula: ${displayCedula}</span>

                <div class="rep-details">
                    <div class="detail-item">
                        <span class="icon-blue">${icons.mail}</span>
                        ${parent.Email}
                    </div>
                    <div class="detail-item">
                        <span class="icon-green">${icons.phone}</span>
                        ${!DatosPersona.Telefono ? "No asignado" : DatosPersona.Telefono}
                    </div>
                    <div class="detail-item">
                        <span class="icon-orange">${icons.map}</span>
                        ${!DatosPersona.Direccion ? "No asignado" : DatosPersona.Direccion}
                    </div>
                    <div class="detail-item">
                        <span class="icon-purple">${icons.briefcase}</span>
                        ${!DatosPersona.Ocupacion ? "No asignado" : DatosPersona.Ocupacion}
                    </div>
                </div>

                <div class="rep-footer">
                    Representante Activo
                </div>        
            `;
      repsList.appendChild(card);
    });
    
    // Actualizamos el contador total. Si hay búsqueda mostramos los filtrados, sino el total real.
    totalCount.textContent = currentSearchQuery !== "" ? `${parentsData.length} (Filtrados)` : parentsData.length;
  };

  // --- APLICAR FILTRO ---
  const applyFilterAndRender = () => {
    if (!currentSearchQuery) {
      renderParents(parents);
      return;
    }

    const filtered = parents.filter(p => {
      const { DatosPersona } = p;
      const query = currentSearchQuery.toLowerCase();
      
      const nameMatch = (DatosPersona.Nombre || "").toLowerCase().includes(query);
      const lastNameMatch = (DatosPersona.Apellido || "").toLowerCase().includes(query);
      const fullNameMatch = `${DatosPersona.Nombre} ${DatosPersona.Apellido}`.toLowerCase().includes(query);
      const cedulaMatch = (DatosPersona.Cedula || "").toString().toLowerCase().includes(query);
      
      return nameMatch || lastNameMatch || fullNameMatch || cedulaMatch;
    });

    renderParents(filtered);
  };

  // Escuchar entrada en la barra de búsqueda
  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim();
      applyFilterAndRender();
    });
  }

  // --- CARGAR DATOS (POLLING) ---
  const loadParentsData = async (isBackgroundUpdate = false) => {
    if (isEditing && isBackgroundUpdate) return;
    if (!isBackgroundUpdate) document.body.appendChild(loader);

    try {
      const parentsResponse = await fetch(
        `${window.APP_CONFIG.api_url}/people/list`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const parentsData = await parentsResponse.json();
      if (parentsResponse.status !== 200) throw new Error(parentsData.message);
      
      parents = parentsData;
      // En vez de usar renderParents directo, aplicamos el filtro por si el administrador estaba buscando algo
      applyFilterAndRender(); 
      
    } catch (error) {
      if (!isBackgroundUpdate) {
        const loadNotification = document.createElement("notification-component");
        loadNotification.setAttribute("type", "error");
        loadNotification.setAttribute("text", "Error cargando lista: " + error);
        notificationsContainer.appendChild(loadNotification);
      }
    } finally {
      if (!isBackgroundUpdate) loader.remove();
    }
  };

  await loadParentsData(false);
  setInterval(() => { loadParentsData(true); }, 5000); 

  // --- MANEJO DEL BOTÓN DE ENVÍO ---
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const firstName = firstNameEntry.value.trim();
    const lastName = lastNameEntry.value.trim();
    const identityRaw = identityEntry.value.trim(); 
    const identityType = typeIdEntry ? typeIdEntry.value : "V"; 
    const gender = genderEntry.value;
    const email = emailEntry.value.trim().toLowerCase(); // Normalizamos a minúsculas
    const notification = document.createElement("notification-component");

    document.body.appendChild(loader);

    try {
      // VALIDACIONES BÁSICAS
      if (firstName.length === 0) { firstNameEntry.focus(); throw new Error("Falta nombre"); }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(firstName)) { firstNameEntry.focus(); throw new Error("Nombre inválido"); }
      if (lastName.length === 0) { lastNameEntry.focus(); throw new Error("Falta apellido"); }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(lastName)) { lastNameEntry.focus(); throw new Error("Apellido inválido"); }
      
      // VALIDACIONES CÉDULA
      if (identityRaw.length === 0) { identityEntry.focus(); throw new Error("Introduce la cédula"); } 
      if (!/^\d+$/.test(identityRaw)) { identityEntry.focus(); throw new Error("La cédula solo debe contener números"); } 
      if (identityRaw.startsWith("0")) { identityEntry.focus(); throw new Error("La cédula no debe empezar por 0"); } 
      if (identityRaw.length < 7) { 
          identityEntry.focus(); 
          throw new Error("La cédula debe tener entre 7 y 9 dígitos"); 
      }
      if (parseInt(identityRaw) <= 1000000) { identityEntry.focus(); throw new Error("La cédula debe ser mayor a 1.000.000"); }

      // === VALIDACIÓN DE CORREO Y DOMINIO ===
      if (gender.length === 0) throw new Error("Indica el género");
      if (email.length === 0) throw new Error("Indica el correo");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo inválido");

      const allowedDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"];
      const emailDomain = email.split('@')[1];
      if (!allowedDomains.includes(emailDomain)) {
        emailEntry.focus();
        throw new Error("Solo se aceptan correos: @gmail.com, @outlook.com, @hotmail.com o @yahoo.com");
      }
      // ===========================

      // CONSTRUCCIÓN DE LA CÉDULA
      let finalIdentity = identityType === "E" ? `E${identityRaw}` : identityRaw;
      let defaultPassword = `${identityType}#${identityRaw}`;

      const payloadPerson = {
        Nombre: firstName,
        Apellido: lastName,
        Sexo: gender,
        Cedula: finalIdentity, 
      };

      if (isEditing) {
        payloadPerson.Email = email; 
        const updateResponse = await fetch(
          `${window.APP_CONFIG.api_url}/people/update/${currentEditId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payloadPerson),
          },
        );

        if (updateResponse.status !== 200) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.message || "Error al actualizar");
        }

        notification.setAttribute("type", "success");
        notification.setAttribute("text", "Datos actualizados correctamente");
        await loadParentsData(true);
        
        // Finalizar modo edición limpiando el formulario
        cancelEdit();

      } else {
        // --- CREAR ---
        // Enviamos campos vacíos extra solo en la creación
        payloadPerson.Direccion = "";
        payloadPerson.Ocupacion = "";
        payloadPerson.Telefono = "";

        const dataResponse = await fetch(
          `${window.APP_CONFIG.api_url}/people/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payloadPerson),
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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              Email: email,
              Rol: "representante",
              Clave: defaultPassword, 
              DatosPersonaId: peopleId,
            }),
          },
        );

        const userData = await userResponse.json();
        if (userResponse.status !== 201) throw new Error(userData.message || userData);

        notification.setAttribute("type", "success");
        notification.setAttribute("text", "Representante registrado correctamente");
        await loadParentsData(true);
        
        repForm.reset();
        if(typeIdEntry) typeIdEntry.value = "V";
      }

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

document.getElementById("BtnBack").addEventListener("click", (event) => {
  event.preventDefault();
  
  // SOLUCIÓN: Guardamos la URL antes de que el evento expire
  const targetUrl = event.currentTarget.href; 
  
  document.body.style.animation = "goodByePage 0.8s forwards";
  
  // Usamos la variable guardada en lugar de buscarla en el evento original
  setTimeout(() => (document.location.href = targetUrl), 1000);
});