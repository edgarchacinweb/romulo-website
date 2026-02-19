import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. Variables y Elementos ---
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit_id");

  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("genero");
  const ciField = document.getElementById("cedula");
  const dateField = document.getElementById("fechaNac");
  const relationshipField = document.getElementById("parentesco");
  const gradeField = document.getElementById("grado");
  const addressField = document.getElementById("direccion");

  const hasIdCheckbox = document.getElementById("hasId");
  const idFormDoc = document.getElementById("IdDoc");
  
  const sameAddressCheckbox = document.getElementById("sameAddress");

  // Elementos Cédula Escolar
  const schoolIdSettings = document.getElementById("schoolIdSettings");
  const useSchoolIdCheckbox = document.getElementById("useSchoolId");
  const schoolIdOptions = document.getElementById("schoolIdOptions");
  const birthOrderSelect = document.getElementById("birthOrder");

  const btnSubmit = document.getElementById("BtnSubmit");
  const btnCancel = document.getElementById("BtnCancel");
  const formTitle = document.querySelector(".page-title h2");
  const mainForm = document.getElementById("inscriptionForm"); // Referencia al formulario para ocultarlo si es necesario

  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";

  let parentData = {};

  // --- FUNCIÓN: BLOQUEAR SI FALTAN DATOS ---
  function mostrarBloqueoPerfil(camposFaltantes) {
      // 1. Ocultar el formulario principal para evitar interacción
      if(mainForm) mainForm.style.display = "none";
      
      // 2. Crear el modal de bloqueo
      const modalOverlay = document.createElement("div");
      Object.assign(modalOverlay.style, {
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex",
          justifyContent: "center", alignItems: "center", padding: "20px"
      });

      const modalContent = document.createElement("div");
      Object.assign(modalContent.style, {
          backgroundColor: "white", padding: "30px", borderRadius: "12px",
          maxWidth: "500px", width: "100%", textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      });

      // CORRECCIÓN AQUÍ: Ruta ajustada a /app/representante/editar-perfil/
      modalContent.innerHTML = `
          <div style="margin-bottom: 20px;">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
          </div>
          <h2 style="color:#1f2937; margin-bottom: 10px;">Perfil Incompleto</h2>
          <p style="color:#4b5563; margin-bottom: 20px; line-height: 1.5;">
              Para poder inscribir a un estudiante, primero debes completar tu información personal de contacto.
          </p>
          <div style="background-color: #fffbeb; border: 1px solid #fcd34d; color: #92400e; padding: 10px; border-radius: 6px; margin-bottom: 25px; text-align: left; font-size: 0.9rem;">
              <strong>Falta por llenar:</strong>
              <ul style="margin: 5px 0 0 20px;">
                  ${camposFaltantes.map(c => `<li>${c}</li>`).join('')}
              </ul>
          </div>
          <a href="/app/representante/editar-perfil/" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.2s;">
              Ir a Editar Perfil
          </a>
      `;

      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
  }

  // --- FUNCIÓN GENERADORA DE CÉDULA ESCOLAR ---
  function generarCedulaEscolar() {
    if (!useSchoolIdCheckbox.checked) return;
    
    if (!parentData.Cedula || !dateField.value) {
        ciField.value = "";
        ciField.placeholder = "Complete fecha y asegúrese de tener cédula cargada...";
        return;
    }

    const parentIdStr = parentData.Cedula.toString().toUpperCase();
    let prefix = ""; 
    
    if (parentIdStr.startsWith("E")) {
        prefix = "E";
    }

    const orden = birthOrderSelect.value; 
    const anio = dateField.value.split("-")[0].slice(-2);
    let cedulaMadre = parentIdStr.replace(/\D/g, ""); 
    cedulaMadre = cedulaMadre.padStart(8, "0");

    const cedulaEscolar = `${prefix}${orden}${anio}${cedulaMadre}`;
    
    ciField.value = cedulaEscolar;
    ciField.readOnly = true;
    
    if (idFormDoc) idFormDoc.style.display = "none";
  }

  try {
    document.body.appendChild(loader);

    // --- 2. VALIDACIÓN DE PERIODO ---
    if (!editId) {
      const checkPeriodResponse = await fetch(
        `${window.APP_CONFIG.api_url}/students/check_period`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!checkPeriodResponse.ok) {
        const mainContainer = document.querySelector(".container") || document.body;
        mainContainer.innerHTML = `<div style="text-align:center; padding: 50px;"><h2>Proceso Cerrado</h2></div>`;
        loader.remove();
        return;
      }
    }

    // --- 3. CARGA DE DATOS ---
    const gradesResponse = await fetch(`${window.APP_CONFIG.api_url}/course/get_all`, { headers: { Authorization: `Bearer ${token}` } });
    const grades = await gradesResponse.json();
    document.querySelectorAll(".grade-option").forEach((opt, index) => {
      if (grades[index]) opt.value = grades[index].CursoId; 
    });

    const parentResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, { headers: { Authorization: `Bearer ${token}` } });
    parentData = await parentResponse.json();

    // ============================================================
    // NUEVA VALIDACIÓN: REVISAR SI FALTAN DATOS DEL REPRESENTANTE
    // ============================================================
    const camposFaltantes = [];
    if (!parentData.Telefono || parentData.Telefono.trim() === "") camposFaltantes.push("Teléfono");
    if (!parentData.Direccion || parentData.Direccion.trim() === "") camposFaltantes.push("Dirección de Habitación");
    if (!parentData.Ocupacion || parentData.Ocupacion.trim() === "") camposFaltantes.push("Ocupación");

    // Si hay campos faltantes, BLOQUEAMOS LA PÁGINA
    if (camposFaltantes.length > 0) {
        loader.remove(); // Quitamos el loader para mostrar el modal
        mostrarBloqueoPerfil(camposFaltantes);
        return; // DETENEMOS TODA LA EJECUCIÓN DEL SCRIPT AQUÍ
    }
    // ============================================================

    const countResponse = await fetch(`${window.APP_CONFIG.api_url}/students/count/by_parent`, { headers: { Authorization: `Bearer ${token}` } });
    const countData = await countResponse.json();
    parentData["students"] = countData;

    // --- 4. MODO EDICIÓN ---
    if (editId) {
      if (formTitle) formTitle.textContent = "Corregir Inscripción";
      btnSubmit.textContent = "Guardar Correcciones";

      const studentResponse = await fetch(`${window.APP_CONFIG.api_url}/students/get/${editId}`, { headers: { Authorization: `Bearer ${token}` } });
      const student = await studentResponse.json();

      if (student.DatosPersona) {
        firstNameField.value = student.DatosPersona.Nombre || "";
        lastNameField.value = student.DatosPersona.Apellido || "";
        genderField.value = student.DatosPersona.Sexo || "";
        ciField.value = student.DatosPersona.Cedula || "";
        addressField.value = student.DatosPersona.Direccion || "";
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    loader.remove();
  }

  // --- 5. Lógica de UI Interactiva ---
  
  if (sameAddressCheckbox) {
      sameAddressCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (parentData && parentData["Direccion"]) {
              addressField.value = parentData["Direccion"];
              addressField.readOnly = true;
          } else {
              alert("El representante no tiene dirección registrada en su perfil.");
              e.target.checked = false;
          }
        } else {
          if (!editId) addressField.value = "";
          addressField.readOnly = false;
          addressField.focus();
        }
      });
  }

  if (schoolIdSettings) {
      schoolIdSettings.style.display = "block";
  }

  gradeField.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const selectedText = selectedOption ? selectedOption.text : "";

      if (useSchoolIdCheckbox.checked && !selectedText.includes("1er Año")) {
          alert("Ha cambiado a un grado distinto a 1er Año. La opción de Cédula Escolar se desactivará.");
          useSchoolIdCheckbox.checked = false;
          schoolIdOptions.style.display = "none";
          ciField.readOnly = false;
          ciField.value = "";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  useSchoolIdCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
          if (!gradeField.value) {
              alert("Por favor seleccione primero el Grado a Cursar.");
              e.target.checked = false;
              return;
          }

          const selectedOption = gradeField.options[gradeField.selectedIndex];
          const selectedText = selectedOption ? selectedOption.text : "";

          if (!selectedText.includes("1er Año")) {
              alert("El estudiante debe ir al SAIME más cercano a sacarse la cédula.");
              e.target.checked = false;
              return;
          }

          schoolIdOptions.style.display = "block";
          hasIdCheckbox.checked = true; 
          generarCedulaEscolar();
      } else {
          schoolIdOptions.style.display = "none";
          ciField.readOnly = false;
          ciField.value = "";
          ciField.placeholder = "Ej: 32000000";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  birthOrderSelect.addEventListener("change", generarCedulaEscolar);
  dateField.addEventListener("change", generarCedulaEscolar);

  if (ciField) {
    ciField.addEventListener("input", function() {
      if (useSchoolIdCheckbox.checked) return; 
      
      this.value = this.value.replace(/[^0-9]/g, "");
      if (this.value.length > 8) this.value = this.value.slice(0, 8);
    });
  }
  
  // Botón Cancelar
  if (btnCancel) {
      btnCancel.addEventListener("click", () => {
          window.location.href = "/app/representante/inicio/";
      });
  }

  // --- 6. ENVÍO DEL FORMULARIO ---
  btnSubmit.addEventListener("click", async () => {
    try {
      if (!firstNameField.value.trim()) throw new Error("Falta el nombre");
      if (!lastNameField.value.trim()) throw new Error("Falta el apellido");
      if (!dateField.value) throw new Error("Falta la fecha de nacimiento");

      const cedulaValStr = ciField.value.trim();
      
      if (useSchoolIdCheckbox.checked) {
          if (cedulaValStr.length < 11 || cedulaValStr.length > 12) {
              throw new Error("La Cédula Escolar generada es inválida (longitud incorrecta)");
          }
      } else {
          if (!cedulaValStr) throw new Error("Debe ingresar la Cédula de Identidad");
          const cedulaNum = parseInt(cedulaValStr, 10);
          if (cedulaNum < 32000000 || cedulaNum > 40000000) {
              throw new Error("La Cédula Regular debe estar entre 32.000.000 y 40.000.000");
          }
      }

      document.body.appendChild(loader);
      const formData = new FormData();

      formData.append("Nombre", firstNameField.value.trim());
      formData.append("Apellido", lastNameField.value.trim());
      formData.append("Genero", genderField.value);
      formData.append("Cedula", ciField.value.trim());

      const dateParts = dateField.value.split("-");
      formData.append("FechaNacimiento", `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);

      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());

      if (!editId) formData.append("IdRepresentante", parentData["DatosPersonaId"]);

      const filesMap = {
        FotoCarnet: "studentPhoto",
        DocDni: "docDni",
        DocPartidaNacimiento: "docPartidaNacimiento",
        DocNotasCertificadas: "docNotasCertificadas",
      };

      for (const [key, id] of Object.entries(filesMap)) {
        const fileInput = document.getElementById(id);
        
        if (key === "DocDni" && useSchoolIdCheckbox.checked) continue;

        if (fileInput && fileInput.files[0]) {
          formData.append(key, fileInput.files[0]);
        } else if (!editId && key !== "DocDni") {
             throw new Error(`Falta cargar: ${key}`);
        }
      }

      let url = editId
        ? `${window.APP_CONFIG.api_url}/students/correct_application/${editId}`
        : `${window.APP_CONFIG.api_url}/students/create`;
      let method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", resData.message);
      notificationsContainer.appendChild(notification);

      setTimeout(() => {
        window.location.href = "/app/representante/inicio/";
      }, 2000);
    } catch (err) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", err.message);
      notificationsContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });

  // --- Visual de Inputs de Archivo ---
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const zone = input.closest(".upload-zone");
      if (file && zone) {
        if (input.id === "studentPhoto") {
             if (!file.type.startsWith("image/")) {
                 alert("Solo se permiten imágenes (JPG, PNG).");
                 input.value = ""; 
                 return;
             }
             const reader = new FileReader();
             reader.onload = (ev) => {
                 zone.style.backgroundImage = `url('${ev.target.result}')`;
                 zone.classList.add("has-image");
             };
             reader.readAsDataURL(file);
        } else {
            zone.querySelector("span").textContent = file.name;
        }
        zone.style.borderColor = "#28a745";
      }
    });
    input.closest(".upload-zone")?.addEventListener("click", () => input.click());
  });
});