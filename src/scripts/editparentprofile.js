import authorize from "./auth.js";

// 1. Autorización
authorize("representante");

// 2. Elementos Globales
const loader = document.createElement("loader-spinner");
const notificationsContainer = document.getElementById("notifications");
const token = localStorage.getItem("auth") ?? "";

// 3. Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  // --- REFERENCIAS AL DOM ---
  const photoPreview = document.getElementById("photoPreview");
  const photoField = document.getElementById("photoUploadInput");
  const firstNameField = document.getElementById("firstNameField");
  const lastNameField = document.getElementById("lastNameField");
  const identityField = document.getElementById("identityField");
  const identityUploadField = document.getElementById("IdentityUploadInput");
  const genderField = document.getElementById("genderField");
  const emailField = document.getElementById("emailField");

  // Referencias para el Feedback Visual de Cédula
  const identityBtn = document.getElementById("btnIdentityUpload");
  const identityBtnText = document.getElementById("btnTextIdentity");
  const identityFileName = document.getElementById("identityFileName");
  
  // Campos editables importantes
  const phoneField = document.getElementById("phoneField");
  const phonePrefixField = document.getElementById("phonePrefixField");
  const occupationField = document.getElementById("occupationField");
  const addressField = document.getElementById("addressField");
  
  // Contraseñas
  const currentPasswordField = document.getElementById("current-password");
  const newPasswordField = document.getElementById("new-password");
  const confirmPasswordField = document.getElementById("confirm-password");
  
  const btnSubmit = document.getElementById("BtnSubmit");
  const uploadIcon = photoPreview ? photoPreview.querySelector(".upload-icon") : null;

  // --- A. CARGA INICIAL DE DATOS ---
  document.body.appendChild(loader);
  try {
    // 1. Obtener Datos Personales
    const parentDataResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!parentDataResponse.ok) throw Error("Error al cargar datos personales");
    const parentData = await parentDataResponse.json();
    
    // 2. Obtener Datos de Usuario
    const parentUserDataResponse = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!parentUserDataResponse.ok) throw Error("Error al cargar usuario");
    const parentUserData = await parentUserDataResponse.json();

    // 3. Cargar Foto de Perfil
    try {
        const profilePhotoResponse = await fetch(
        `${window.APP_CONFIG.api_url}/docs/get/carnet-${parentUserData.UsuarioId}.webp`,
        { method: "GET", headers: { "Content-Type": "image/webp" } });

        if (profilePhotoResponse.ok) {
            const profilePhoto = await profilePhotoResponse.blob();
            if (photoPreview) {
                photoPreview.style.backgroundImage = `url(${URL.createObjectURL(profilePhoto)})`;
                if (uploadIcon) uploadIcon.style.display = "none";
            }
        }
    } catch (e) { console.warn("No se pudo cargar la foto de perfil previa"); }

    // --- NUEVO: 3.1 VERIFICAR SI YA EXISTE CÉDULA CARGADA ---
    try {
        // Construimos la URL probable del archivo (siguiendo el patrón de la foto)
        // Usamos dni-{UUID}.pdf
        const dniUrl = `${window.APP_CONFIG.api_url}/docs/get/dni-${parentUserData.UsuarioId}.pdf`;
        
        // Hacemos una petición ligera (HEAD) para ver si el archivo existe sin descargarlo todo
        // Si el servidor no soporta HEAD, caerá en el catch o dará error, pero intentamos.
        const dniResponse = await fetch(dniUrl, { method: "HEAD" });

        // Si responde OK (200), significa que el archivo existe en el servidor
        if (dniResponse.ok || dniResponse.status === 200) {
            // Actualizamos la UI al estado "Verde"
            if (identityBtn) {
                identityBtn.classList.remove("btn-outline");
                identityBtn.classList.add("btn-success");
            }
            if (identityBtnText) {
                identityBtnText.textContent = "Cédula Cargada";
            }
            if (identityFileName) {
                // Mostramos un enlace o texto indicando que ya está guardado
                identityFileName.innerHTML = `<span style="color:var(--success)"></span>`; //creo que no es necesario, pero podemos agregarlo despues (NG)
                identityFileName.style.display = "block";
            }
        }
    } catch (e) {
        // Si falla (404 no existe, u otro error), simplemente lo dejamos en gris (estado por defecto)
        console.warn("No se detectó cédula previa o error al verificar:", e);
    }
    // ---------------------------------------------------------

    // 4. Llenar campos
    if(firstNameField) firstNameField.value = parentData["Nombre"] ?? "";
    if(lastNameField) lastNameField.value = parentData["Apellido"] ?? "";
    if(identityField) identityField.value = `V-${parentData["Cedula"]}` ?? "";
    if(emailField) emailField.value = parentUserData["Email"] ?? "";
    if(occupationField) occupationField.value = parentData["Ocupacion"] || "";
    if(addressField) addressField.value = parentData["Direccion"] || "";

    // Género
    if(genderField) {
        const sexoRecibido = parentData["Sexo"] ?? "";
        genderField.value = sexoRecibido;
        if (genderField.value !== sexoRecibido && sexoRecibido) {
            Array.from(genderField.options).forEach(opt => {
                if (opt.text === sexoRecibido) genderField.value = opt.value;
            });
        }
    }

    // Teléfono
    if(phoneField && phonePrefixField) {
        const phone = parentData["Telefono"] ?? "";
        const parts = phone.split("-");
        if (parts.length === 2) {
            phonePrefixField.value = parts[0];
            phoneField.value = parts[1];
        } else {
            phonePrefixField.value = "0412";
            phoneField.value = phone; 
        }
    }

  } catch (error) {
    console.error(error);
    const notif = document.createElement("notification-component");
    notif.setAttribute("text", "Error cargando perfil. Recargue la página.");
    notif.setAttribute("type", "error");
    notificationsContainer.appendChild(notif);
  } finally {
    loader.remove();
  }

  // --- B. GUARDADO DE DATOS ---
  if(btnSubmit) {
      btnSubmit.addEventListener("click", async (event) => {
        event.preventDefault();
        document.body.appendChild(loader);

        try {
          const formData = new FormData();
          let hasChanges = false;

          const telValue = phoneField ? phoneField.value.trim() : "";
          const occValue = occupationField ? occupationField.value.trim() : "";
          const addrValue = addressField ? addressField.value.trim() : "";
          const passValue = newPasswordField ? newPasswordField.value.trim() : "";

          // VALIDACIONES
          if (telValue && !/^\d{7}$/.test(telValue)) throw new Error("El teléfono debe tener 7 dígitos numéricos");
          if (occValue && occValue.length < 3) throw new Error("La ocupación es demasiado corta");
          if (addrValue && addrValue.length < 5) throw new Error("La dirección es demasiado corta");
          
          if (passValue) {
              if (!currentPasswordField.value.trim()) throw new Error("Para cambiar la clave, indique su contraseña actual");
              if (passValue !== confirmPasswordField.value.trim()) throw new Error("Las nuevas contraseñas no coinciden");
              if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&._-])[A-Za-z\d$@$!%*?&._-]{8,}$/.test(passValue)) {
                  throw new Error("La contraseña debe tener: Mayúscula, minúscula, número y símbolo.");
              }
              formData.append("Clave", passValue);
              formData.append("VClave", currentPasswordField.value.trim());
              formData.append("RClave", confirmPasswordField.value.trim());
              hasChanges = true;
          }

          if (telValue) {
              const fullPhone = `${phonePrefixField.value}-${telValue}`;
              formData.append("Telefono", fullPhone);
              hasChanges = true;
          }
          if (occValue) { formData.append("Ocupacion", occValue); hasChanges = true; }
          if (addrValue) { formData.append("Direccion", addrValue); hasChanges = true; }

          if (photoField && photoField.files[0]) { formData.append("Foto", photoField.files[0]); hasChanges = true; }
          if (identityUploadField && identityUploadField.files[0]) { formData.append("DNI", identityUploadField.files[0]); hasChanges = true; }

          if (!hasChanges) throw new Error("No hay cambios para guardar.");

          const response = await fetch(`${window.APP_CONFIG.api_url}/user/parent/update`, {
            method: "PATCH",
            body: formData,
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Error del servidor al guardar.");
          }

          const notif = document.createElement("notification-component");
          notif.setAttribute("text", "¡Datos actualizados correctamente!");
          notif.setAttribute("type", "success");
          notificationsContainer.appendChild(notif);

          setTimeout(() => window.location.reload(), 1500);

        } catch (e) {
          console.error(e);
          const notif = document.createElement("notification-component");
          notif.setAttribute("text", e.message);
          notif.setAttribute("type", "error");
          notificationsContainer.appendChild(notif);
        } finally {
          loader.remove();
        }
      });
  }

  // --- C. VALIDACIONES Y EVENTOS VISUALES ---
  
  // 1. BLOQUEO TOTAL DE LETRAS EN TELÉFONO
  if (phoneField) {
    phoneField.addEventListener("keydown", function(e) {
      const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    });

    phoneField.addEventListener("input", function() {
      this.value = this.value.replace(/[^0-9]/g, "");
      if (this.value.length > 7) this.value = this.value.slice(0, 7);
    });
  }

  // 2. Feedback visual Cédula (Al seleccionar archivo nuevo)
  if (identityUploadField && identityBtn) {
    identityUploadField.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        const file = this.files[0];
        identityBtn.classList.remove("btn-outline");
        identityBtn.classList.add("btn-success");
        if (identityBtnText) identityBtnText.textContent = "Cédula Cargada";
        if (identityFileName) {
          identityFileName.textContent = `Archivo nuevo: ${file.name}`;
          identityFileName.style.display = "block";
          identityFileName.style.color = "var(--primary-color)"; // Color normal para nuevo archivo
        }
      } else {
        // Si cancela, ¿volvemos al estado gris o verificamos si ya había uno?
        // Por simplicidad, volvemos a gris, el usuario puede recargar si quiere ver el estado original.
        identityBtn.classList.remove("btn-success");
        identityBtn.classList.add("btn-outline");
        if (identityBtnText) identityBtnText.textContent = "Cargar Cédula";
        if (identityFileName) {
          identityFileName.textContent = "";
          identityFileName.style.display = "none";
        }
      }
    });
  }

  // 3. Previsualización de Foto
  if(photoField) {
      photoField.addEventListener("change", function(e){
          const file = e.target.files[0];
          if(file) {
             if (!file.type.startsWith("image/")) {
                 alert("Solo se permiten imágenes (JPG, PNG).");
                 this.value = ""; return;
             }
             if (file.size > 5 * 1024 * 1024) {
                 alert("La imagen es muy pesada (Máx 5MB).");
                 this.value = ""; return;
             }
             const reader = new FileReader();
             reader.onload = (ev) => {
                 if(photoPreview) photoPreview.style.backgroundImage = `url('${ev.target.result}')`;
                 if(uploadIcon) uploadIcon.style.display="none";
             };
             reader.readAsDataURL(file);
          }
      });
  }
  
  // 4. Mostrar/Ocultar Contraseña
  document.querySelectorAll(".toggle-password").forEach(btn => {
      btn.addEventListener("click", function() {
          const inp = this.previousElementSibling;
          const open = this.querySelector(".eye-open");
          const closed = this.querySelector(".eye-closed");
          if(inp.type==="password"){
              inp.type="text";
              if(open) open.classList.add("hidden");
              if(closed) closed.classList.remove("hidden");
          } else {
              inp.type="password";
              if(open) open.classList.remove("hidden");
              if(closed) closed.classList.add("hidden");
          }
      });
  });
});