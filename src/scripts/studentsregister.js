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
  const formTitle = document.querySelector(".page-title h2");

  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";

  let parentData = {};

  // --- FUNCIÓN GENERADORA DE CÉDULA ESCOLAR (SIN DOBLE V) ---
  function generarCedulaEscolar() {
    if (!useSchoolIdCheckbox.checked) return;
    
    // 1. Validar datos requeridos
    if (!parentData.Cedula || !dateField.value) {
        ciField.value = "";
        ciField.placeholder = "La cedula se generará automaticamente, llena los demas campos...";
        return;
    }

    // A. Detectar Nacionalidad del Representante
    // Si la cédula del representante empieza con "E", la escolar también llevará "E".
    // Si no (es solo números o empieza con "V"), NO ponemos prefijo (se guarda como número puro).
    const parentIdStr = parentData.Cedula.toString().toUpperCase();
    let prefix = ""; // Por defecto VACÍO para Venezolanos (evita V-V al visualizar)
    
    if (parentIdStr.startsWith("E")) {
        prefix = "E";
    }

    // B. Orden de nacimiento (1 al 9)
    const orden = birthOrderSelect.value; 

    // C. Últimos 2 dígitos del año
    const anio = dateField.value.split("-")[0].slice(-2);

    // D. Cédula Madre (Solo números, rellena con ceros a la izquierda hasta 8 dígitos)
    let cedulaMadre = parentIdStr.replace(/\D/g, ""); 
    cedulaMadre = cedulaMadre.padStart(8, "0");

    // Resultado:
    // - Venezolano: "" + 1 + 10 + 12345678 = "11012345678" (11 dígitos puros)
    // - Extranjero: "E" + 1 + 10 + 12345678 = "E11012345678" (12 caracteres)
    const cedulaEscolar = `${prefix}${orden}${anio}${cedulaMadre}`;
    
    ciField.value = cedulaEscolar;
    ciField.readOnly = true;
    
    // Ocultar carga de documento de identidad pues es escolar
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

    // --- 3. Carga Inicial ---
    const gradesResponse = await fetch(`${window.APP_CONFIG.api_url}/course/get_all`, { headers: { Authorization: `Bearer ${token}` } });
    const grades = await gradesResponse.json();
    document.querySelectorAll(".grade-option").forEach((opt, index) => {
      if (grades[index]) opt.value = grades[index].CursoId; 
    });

    const parentResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, { headers: { Authorization: `Bearer ${token}` } });
    parentData = await parentResponse.json();

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
        // Nota: Faltaría lógica para detectar si la cédula es escolar al editar, 
        // pero por simplicidad se mantiene la carga base.
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    loader.remove();
  }

  // --- 5. Lógica de UI Interactiva ---
  
  // A. Checkbox "Misma Dirección" (RESTAURADO)
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

  // B. Mostrar opción de Cédula Escolar SIEMPRE
  if (schoolIdSettings) {
      schoolIdSettings.style.display = "block";
  }

  // C. Listener para detectar cambio de Grado
  gradeField.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const selectedText = selectedOption ? selectedOption.text : "";

      // Si estaba activa la escolar y cambiamos a un grado que NO es 1ero
      if (useSchoolIdCheckbox.checked && !selectedText.includes("1er Año")) {
          alert("Ha cambiado a un grado distinto a 1er Año. La opción de Cédula Escolar se desactivará.");
          useSchoolIdCheckbox.checked = false;
          schoolIdOptions.style.display = "none";
          ciField.readOnly = false;
          ciField.value = "";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  // D. Activar Cédula Escolar (Con validación estricta de 1er Año)
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

  // E. Recalcular si cambian los factores de la cédula escolar
  birthOrderSelect.addEventListener("change", generarCedulaEscolar);
  dateField.addEventListener("change", generarCedulaEscolar);

  // F. Validaciones en tiempo real del input Cédula
  if (ciField) {
    ciField.addEventListener("input", function() {
      if (useSchoolIdCheckbox.checked) return; // Si es escolar, no permitir edición manual
      
      // Si es manual (regular), solo números y max 8 dígitos
      this.value = this.value.replace(/[^0-9]/g, "");
      if (this.value.length > 8) this.value = this.value.slice(0, 8);
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
          // ACEPTAMOS 11 DÍGITOS (Venezolanos) o 12 CARACTERES (Extranjeros)
          if (cedulaValStr.length < 11 || cedulaValStr.length > 12) {
              throw new Error("La Cédula Escolar generada es inválida (longitud incorrecta)");
          }
      } else {
          // Validación Cédula Regular
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
        
        // Si es Cédula Escolar, no exigimos el PDF de la cédula
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