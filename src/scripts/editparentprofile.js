import authorize from "./auth.js";

// 1. Autorización
authorize("representante");

// 2. Elementos Globales
const loader = document.createElement("loader-spinner");
const notificationsContainer = document.getElementById("notifications");
const token = localStorage.getItem("auth") ?? "";

// 3. Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  // --- REFERENCIAS AL DOM (Asegúrate que coincidan con tu HTML) ---
  const photoPreview = document.getElementById("photoPreview");
  const photoField = document.getElementById("photoUploadInput");
  const firstNameField = document.getElementById("firstNameField");
  const lastNameField = document.getElementById("lastNameField");
  const identityField = document.getElementById("identityField");
  const identityUploadField = document.getElementById("IdentityUploadInput");
  const genderField = document.getElementById("genderField");
  const emailField = document.getElementById("emailField");
  
  // Campos editables importantes
  const phoneField = document.getElementById("phoneField");
  const phonePrefixField = document.getElementById("phonePrefixField");
  const occupationField = document.getElementById("occupationField");
  const addressField = document.getElementById("addressField"); // ID debe ser 'addressField' en el HTML
  
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
    
    // 2. Obtener Datos de Usuario (Email)
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

    // 4. Llenar los campos visuales
    if(firstNameField) firstNameField.value = parentData["Nombre"] ?? "";
    if(lastNameField) lastNameField.value = parentData["Apellido"] ?? "";
    if(identityField) identityField.value = `V-${parentData["Cedula"]}` ?? "";
    if(emailField) emailField.value = parentUserData["Email"] ?? "";
    
    // Asignación directa de Ocupación y Dirección
    if(occupationField) occupationField.value = parentData["Ocupacion"] || "";
    if(addressField) addressField.value = parentData["Direccion"] || "";

    // Género
    if(genderField) {
        const sexoRecibido = parentData["Sexo"] ?? "";
        genderField.value = sexoRecibido;
        // Fix para selects que no coinciden en value/text
        if (genderField.value !== sexoRecibido && sexoRecibido) {
            Array.from(genderField.options).forEach(opt => {
                if (opt.text === sexoRecibido) genderField.value = opt.value;
            });
        }
    }

    // Teléfono (Separar prefijo y número)
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

  // --- B. GUARDADO DE DATOS (LOGICA BLINDADA) ---
  if(btnSubmit) {
      btnSubmit.addEventListener("click", async (event) => {
        event.preventDefault();
        document.body.appendChild(loader); // Mostrar loader

        try {
          const formData = new FormData();
          let hasChanges = false;

          // 1. OBTENER VALORES ACTUALES
          const telValue = phoneField ? phoneField.value.trim() : "";
          const occValue = occupationField ? occupationField.value.trim() : "";
          const addrValue = addressField ? addressField.value.trim() : "";
          const passValue = newPasswordField ? newPasswordField.value.trim() : "";

          // 2. VALIDACIONES LOCALES
          if (telValue && !/^\d{7}$/.test(telValue)) throw new Error("El teléfono debe tener 7 dígitos numéricos");
          if (occValue && occValue.length < 3) throw new Error("La ocupación es demasiado corta");
          if (addrValue && addrValue.length < 5) throw new Error("La dirección es demasiado corta");
          
          // Validación Contraseña
          if (passValue) {
              if (!currentPasswordField.value.trim()) throw new Error("Para cambiar la clave, indique su contraseña actual");
              if (passValue !== confirmPasswordField.value.trim()) throw new Error("Las nuevas contraseñas no coinciden");
              // Regex fuerte
              if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&._-])[A-Za-z\d$@$!%*?&._-]{8,}$/.test(passValue)) {
                  throw new Error("La contraseña debe tener: Mayúscula, minúscula, número y símbolo.");
              }
              formData.append("Clave", passValue);
              formData.append("VClave", currentPasswordField.value.trim());
              formData.append("RClave", confirmPasswordField.value.trim());
              hasChanges = true;
          }

          // 3. CONSTRUIR FORMDATA (Enviar siempre que tengan valor)
          
          if (telValue) {
              const fullPhone = `${phonePrefixField.value}-${telValue}`;
              formData.append("Telefono", fullPhone);
              hasChanges = true;
          }
          
          if (occValue) {
              formData.append("Ocupacion", occValue);
              hasChanges = true;
          }
          
          if (addrValue) {
              formData.append("Direccion", addrValue);
              hasChanges = true;
          }

          // Archivos
          if (photoField && photoField.files[0]) {
              formData.append("Foto", photoField.files[0]);
              hasChanges = true;
          }
          if (identityUploadField && identityUploadField.files[0]) {
              formData.append("DNI", identityUploadField.files[0]);
              hasChanges = true;
          }

          // Validar si hay algo que enviar
          if (!hasChanges) {
              throw new Error("No hay cambios para guardar.");
          }

          // --- DEBUG EN CONSOLA (Para ver qué se envía) ---
          console.log("--- ENVIANDO AL SERVIDOR ---");
          for (let pair of formData.entries()) {
              console.log(pair[0] + ': ' + pair[1]); 
          }

          // 4. PETICIÓN AL SERVIDOR
          const response = await fetch(`${window.APP_CONFIG.api_url}/user/parent/update`, {
            method: "PATCH",
            body: formData,
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Error del servidor al guardar.");
          }

          // 5. ÉXITO
          const notif = document.createElement("notification-component");
          notif.setAttribute("text", "¡Datos actualizados correctamente!");
          notif.setAttribute("type", "success");
          notificationsContainer.appendChild(notif);

          // Recargar para ver cambios
          setTimeout(() => window.location.reload(), 1500);

        } catch (e) {
          console.error(e);
          const notif = document.createElement("notification-component");
          notif.setAttribute("text", e.message);
          notif.setAttribute("type", "error");
          notificationsContainer.appendChild(notif);
        } finally {
          loader.remove(); // Quitar loader
        }
      });
  }

  // --- C. EXTRAS VISUALES ---
  
  // Previsualización de Foto
  if(photoField) {
      photoField.addEventListener("change", function(e){
          const file = e.target.files[0];
          if(file) {
             if (!file.type.startsWith("image/")) {
                 alert("Solo se permiten imágenes (JPG, PNG).");
                 this.value = ""; return;
             }
             if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
  
  // Mostrar/Ocultar Contraseña
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