import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", async () => {
  // --- FUNCIÓN PARA TRADUCIR ERRORES TÉCNICOS A MENSAJES AMIGABLES ---
  function translateError(techMsg) {
    if (!techMsg) return "Ocurrió un error inesperado. Intente nuevamente.";
    const msg = techMsg.toLowerCase();

    // Errores comunes de Base de Datos que queremos ocultar al usuario
    if (msg.includes("llave duplicada") || msg.includes("unique constraint") || msg.includes("ya existe la llave")) {
      return "El estudiante con esta cédula ya se encuentra registrado en el sistema.";
    }
    if (msg.includes("tipo uuid") || msg.includes("invalid input syntax for type uuid")) {
      return "Falta información. Asegúrese de haber seleccionado una opción válida en el Grado a cursar.";
    }
    if (msg.includes("tipo integer") || msg.includes("invalid input syntax for type integer")) {
      return "Hay un error numérico. Es posible que esté introduciendo letras en un campo que solo admite números, verifique la cédula.";
    }
    if (msg.includes("value too long") || msg.includes("demasiado largo")) {
      return "Uno de los textos ingresados (como nombres o dirección) es demasiado largo. Por favor, resúmalo.";
    }
    if (msg.includes("null value") || msg.includes("violates not-null constraint")) {
      return "Faltan campos obligatorios por llenar. Revise el formulario detalladamente.";
    }
    if (msg.includes("foreign key") || msg.includes("llave foránea")) {
      return "Hay un problema con la información seleccionada. Por favor, recargue la página e intente de nuevo.";
    }
    if (msg.includes("syntax error") || msg.includes("line ") || msg.includes("error:")) {
      return "Ocurrió un error interno al guardar. Verifique que todos los datos sean correctos.";
    }

    // Si el mensaje no contiene palabras técnicas, asumimos que es un mensaje amigable (ej: "Falta el nombre") y lo mostramos tal cual.
    return techMsg;
  }

  // --- 1. Variables y Elementos ---
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit_id");
  const reinscribeId = urlParams.get("reinscribe_id");

  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("genero");
  
  // Elementos de Cédula y Nacionalidad
  const ciField = document.getElementById("cedula");
  const nacionalidadSelect = document.getElementById("nacionalidad");
  const nacionalidadWrapper = document.getElementById("nacionalidadWrapper");
  
  const dateField = document.getElementById("fechaNac");
  const relationshipField = document.getElementById("parentesco");
  const gradeField = document.getElementById("grado");
  const addressField = document.getElementById("direccion");

  const hasIdCheckbox = document.getElementById("hasId");
  const idFormDoc = document.getElementById("IdDoc");
  
  // Elementos Autorización
  const authDocZone = document.getElementById("AutorizacionDoc");
  const authDocInput = document.getElementById("docAutorizacion");
  
  const sameAddressCheckbox = document.getElementById("sameAddress");

  // Elementos Cédula Escolar
  const schoolIdSettings = document.getElementById("schoolIdSettings");
  const useSchoolIdCheckbox = document.getElementById("useSchoolId");
  const schoolIdOptions = document.getElementById("schoolIdOptions");
  const birthOrderSelect = document.getElementById("birthOrder");

  const btnSubmit = document.getElementById("BtnSubmit");
  const btnCancel = document.getElementById("BtnCancel");
  const formTitle = document.querySelector(".page-title h2");
  const mainForm = document.getElementById("inscriptionForm");

  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";

  let parentData = {};

  // --- FUNCIÓN: RESTRICCIÓN DINÁMICA DE FECHA DE NACIMIENTO (11-18 AÑOS) ---
  function configurarRestriccionesFechaNacimiento() {
    const hoy = new Date();
    
    // Hace exactamente 18 años (Fecha Mínima permitida)
    const minDateObj = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    // Hace exactamente 11 años (Fecha Máxima permitida)
    const maxDateObj = new Date(hoy.getFullYear() - 11, hoy.getMonth(), hoy.getDate());

    const formatISO = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const minDateISO = formatISO(minDateObj);
    const maxDateISO = formatISO(maxDateObj);

    if (dateField) {
      dateField.setAttribute("min", minDateISO);
      dateField.setAttribute("max", maxDateISO);
    }

    return { minDateISO, maxDateISO };
  }

  // Ejecutamos la restricción dinámica al cargar
  const { minDateISO, maxDateISO } = configurarRestriccionesFechaNacimiento();

  // --- FILTRO EN TIEMPO REAL: SOLO LETRAS PARA NOMBRES Y APELLIDOS ---
  function filterLetters(e) {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  }

  if (firstNameField) firstNameField.addEventListener("input", filterLetters);
  if (lastNameField) lastNameField.addEventListener("input", filterLetters);


  // --- FUNCIÓN: BLOQUEAR SI FALTAN DATOS ---
  function mostrarBloqueoPerfil(camposFaltantes) {
      if(mainForm) mainForm.style.display = "none";
      
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
        ciField.placeholder = "La cédula escolar se genera al seleccionar el orden de nacimiento y fecha de nacimiento";
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
    if (!editId && !reinscribeId) {
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
    if(!gradesResponse.ok) throw new Error("Error al consultar los grados escolares.");
    const grades = await gradesResponse.json();
    document.querySelectorAll(".grade-option").forEach((opt, index) => {
      if (grades[index]) opt.value = grades[index].CursoId; 
    });

    const parentResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, { headers: { Authorization: `Bearer ${token}` } });
    if(!parentResponse.ok) throw new Error("Error al obtener los datos del representante.");
    parentData = await parentResponse.json();

    const camposFaltantes = [];
    if (!parentData.Telefono || parentData.Telefono.trim() === "") camposFaltantes.push("Teléfono");
    if (!parentData.Direccion || parentData.Direccion.trim() === "") camposFaltantes.push("Dirección de Habitación");
    if (!parentData.Ocupacion || parentData.Ocupacion.trim() === "") camposFaltantes.push("Ocupación");

    if (camposFaltantes.length > 0) {
        loader.remove();
        mostrarBloqueoPerfil(camposFaltantes);
        return; 
    }

    const parentIdForCount = parentData["DatosPersonaId"] || parentData["id"];
    const countResponse = await fetch(`${window.APP_CONFIG.api_url}/students/count/by_parent/${parentIdForCount}`, { headers: { Authorization: `Bearer ${token}` } });
    const countData = await countResponse.json();
    parentData["students"] = countData;

    // --- 4. MODO EDICIÓN O REINSCRIPCIÓN ---
    if (editId || reinscribeId) {
      const targetId = editId || reinscribeId;

      if (editId) {
          if (formTitle) formTitle.textContent = "Corregir Inscripción";
          btnSubmit.textContent = "Guardar Correcciones";
      } else if (reinscribeId) {
          if (formTitle) formTitle.textContent = "Reinscripción Estudiantil";
          btnSubmit.textContent = "Confirmar Reinscripción";
      }

      const studentResponse = await fetch(`${window.APP_CONFIG.api_url}/students/get/${targetId}`, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!studentResponse.ok) {
          const errData = await studentResponse.json();
          throw new Error(errData.message || "Error al obtener los datos del estudiante.");
      }
      
      const student = await studentResponse.json();

      if (student) {
        firstNameField.value = student.Nombre || "";
        lastNameField.value = student.Apellido || "";
        genderField.value = student.Genero || "";
        addressField.value = student.Direccion || "";

        if (student.Parentesco) {
            relationshipField.value = student.Parentesco;
            relationshipField.dispatchEvent(new Event('change'));
        }

        if (student.FechaNacimiento) {
            let parsedDate = student.FechaNacimiento;
            if (parsedDate.includes(" ")) parsedDate = parsedDate.split(" ")[0];
            dateField.value = parsedDate;
        }

        const photoZone = document.getElementById("photoUpload");
        if (photoZone && targetId) {
            const photoUrl = `${window.APP_CONFIG.api_url}/docs/get/carnet-${targetId}.webp`;
            photoZone.style.backgroundImage = `url('${photoUrl}')`;
            photoZone.classList.add("has-image");
        }

        const markZoneAsLoaded = (inputId) => {
            const input = document.getElementById(inputId);
            if (input) {
                const zone = input.closest(".upload-zone");
                if (zone) {
                    zone.style.borderColor = "#28a745";
                    zone.style.backgroundColor = "#f8fff9";
                    const span = zone.querySelector("span");
                    if (span) {
                        span.textContent = "PDF en sistema";
                        span.style.color = "#28a745";
                        span.style.fontWeight = "bold";
                    }
                }
            }
        };

        markZoneAsLoaded("docDni");
        markZoneAsLoaded("docPartidaNacimiento");

        if (student.Parentesco && student.Parentesco !== "Padre" && student.Parentesco !== "Madre") {
            markZoneAsLoaded("docAutorizacion");
        }

        if (editId) {
            markZoneAsLoaded("docNotasCertificadas");
        }

        if (reinscribeId) {
            const currentGrade = student.Grado ? parseInt(student.Grado, 10) : 1;
            const nextGradeNum = currentGrade < 5 ? currentGrade + 1 : 5; 

            Array.from(gradeField.options).forEach(opt => {
                if (opt.text.includes(`${nextGradeNum}`)) {
                    gradeField.value = opt.value;
                }
            });

            gradeField.style.pointerEvents = "none";
            gradeField.style.backgroundColor = "#e9ecef";

            firstNameField.readOnly = true;
            firstNameField.style.backgroundColor = "#e9ecef";
            lastNameField.readOnly = true;
            lastNameField.style.backgroundColor = "#e9ecef";

            dateField.readOnly = true;
            dateField.style.pointerEvents = "none"; 
            dateField.style.backgroundColor = "#e9ecef";

            relationshipField.style.pointerEvents = "none";
            relationshipField.style.backgroundColor = "#e9ecef";

            const photoInput = document.getElementById("studentPhoto");
            if (photoInput) photoInput.disabled = true; 
            if (photoZone) {
                photoZone.style.pointerEvents = "none"; 
                const uploadContent = photoZone.querySelector(".upload-content");
                if (uploadContent) uploadContent.style.display = "none"; 
            }
        } else if (editId) {
            gradeField.value = student.IdCurso;
        }

        let rawCedula = student.Cedula || "";
        let limpiaCedula = rawCedula.replace(/-/g, "").trim();
        
        if (limpiaCedula.length > 9) {
            useSchoolIdCheckbox.checked = true;
            schoolIdOptions.style.display = "block";
            nacionalidadWrapper.style.display = "none";
            ciField.value = rawCedula;
            ciField.readOnly = true;
            if (idFormDoc) idFormDoc.style.display = "none";
        } else {
            useSchoolIdCheckbox.checked = false;
            nacionalidadWrapper.style.display = "block";
            ciField.readOnly = false;
            
            if (rawCedula.startsWith("V-") || rawCedula.startsWith("E-")) {
                nacionalidadSelect.value = rawCedula.charAt(0);
                ciField.value = rawCedula.substring(2);
            } else if (rawCedula.startsWith("V") || rawCedula.startsWith("E")) {
                nacionalidadSelect.value = rawCedula.charAt(0);
                ciField.value = rawCedula.substring(1);
            } else {
                nacionalidadSelect.value = "V";
                ciField.value = rawCedula;
            }
        }
      }
    }
  } catch (err) {
    console.error("Error capturado:", err);
    const friendlyError = translateError(err.message); // Usamos el traductor aquí también
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", friendlyError);
    notificationsContainer?.appendChild(notification);
  } finally {
    loader.remove();
  }

  // --- 5. Lógica de UI Interactiva ---

  relationshipField.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val && val !== "Padre" && val !== "Madre") {
          authDocZone.style.display = "block";
      } else {
          authDocZone.style.display = "none";
          authDocInput.value = ""; 
          const zone = authDocInput.closest(".upload-zone");
          if (zone) {
              zone.querySelector("span").textContent = "Haga clic para cargar";
              zone.style.borderColor = "";
              zone.style.backgroundColor = "";
              zone.querySelector("span").style.color = "";
              zone.querySelector("span").style.fontWeight = "";
          }
      }
  });

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
          if (!editId && !reinscribeId) addressField.value = "";
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
          nacionalidadWrapper.style.display = "block";
          ciField.readOnly = false;
          ciField.value = "";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  useSchoolIdCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
          if (!gradeField.value || gradeField.value === "Requerida") {
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
          nacionalidadWrapper.style.display = "none"; 
          hasIdCheckbox.checked = true; 
          generarCedulaEscolar();
      } else {
          schoolIdOptions.style.display = "none";
          nacionalidadWrapper.style.display = "block"; 
          ciField.readOnly = false;
          ciField.value = "";
          ciField.placeholder = "Ej: 34000000";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  birthOrderSelect.addEventListener("change", generarCedulaEscolar);
  dateField.addEventListener("change", generarCedulaEscolar);

  // --- 5.1 VALIDACIÓN UX: EDAD POR GRADO EN TIEMPO REAL ---
  function checkAgeGradeValidity() {
    const errorId = "age-grade-warning";
    let errorMsg = document.getElementById(errorId);

    if (!dateField.value || !gradeField.value || gradeField.value === "Requerida") {
      if (errorMsg) errorMsg.remove();
      gradeField.style.borderColor = "";
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = "";
      btnSubmit.style.cursor = "";
      return;
    }

    const birthDate = new Date(dateField.value);
    const today = new Date();
    let edad = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const m = today.getUTCMonth() - birthDate.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
      edad--;
    }

    const selectedOption = gradeField.options[gradeField.selectedIndex];
    const gradeText = selectedOption ? selectedOption.text : "";
    const gradoNum = parseInt(gradeText.charAt(0));

    const rangos = {
        1: { min: 11, max: 13, text: "1er Año" },
        2: { min: 13, max: 14, text: "2do Año" },
        3: { min: 14, max: 15, text: "3er Año" },
        4: { min: 15, max: 16, text: "4to Año" },
        5: { min: 16, max: 18, text: "5to Año" }
    };

    const config = rangos[gradoNum];
    if (config) {
        if (edad < config.min || edad > config.max) {
             if (!errorMsg) {
                 errorMsg = document.createElement("div");
                 errorMsg.id = errorId;
                 errorMsg.style.color = "#dc3545";
                 errorMsg.style.fontSize = "0.85rem";
                 errorMsg.style.marginTop = "5px";
                 errorMsg.style.fontWeight = "bold";
                 gradeField.closest(".form-group").appendChild(errorMsg);
             }
             errorMsg.textContent = `La edad del estudiante (${edad} años) no corresponde al rango permitido (${config.min}-${config.max} años) para ${config.text}.`;
             gradeField.style.borderColor = "#dc3545";
             btnSubmit.disabled = true;
             btnSubmit.style.opacity = "0.5";
             btnSubmit.style.cursor = "not-allowed";
             return false;
        } else {
             if (errorMsg) errorMsg.remove();
             gradeField.style.borderColor = "";
             btnSubmit.disabled = false;
             btnSubmit.style.opacity = "";
             btnSubmit.style.cursor = "";
             return true;
        }
    }
    return true;
  }

  dateField.addEventListener("input", checkAgeGradeValidity);
  gradeField.addEventListener("change", checkAgeGradeValidity);

  // Llamada inicial por si ya hay datos (ej: modo edición o re-inscripción)
  setTimeout(checkAgeGradeValidity, 1500); 

  if (ciField) {
    ciField.addEventListener("input", function() {
      if (useSchoolIdCheckbox.checked) return; 
      
      this.value = this.value.replace(/[^0-9]/g, ""); 
      if (this.value.length > 8) this.value = this.value.slice(0, 8);
    });
  }
  
  if (btnCancel) {
      btnCancel.addEventListener("click", () => {
          window.location.href = "/app/representante/inicio/";
      });
  }

  // --- 6. ENVÍO DEL FORMULARIO ---
  btnSubmit.addEventListener("click", async () => {
    try {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      const nombreVal = firstNameField.value.trim();
      const apellidoVal = lastNameField.value.trim();

      // Validaciones proactivas para evitar errores técnicos del servidor (ej. el de UUID y Not Null)
      if (!nombreVal) throw new Error("Falta indicar el nombre del estudiante.");
      if (!nameRegex.test(nombreVal)) throw new Error("El nombre solo debe contener letras.");

      if (!apellidoVal) throw new Error("Falta indicar el apellido del estudiante.");
      if (!nameRegex.test(apellidoVal)) throw new Error("El apellido solo debe contener letras.");

      if (!gradeField.value || gradeField.value === "Requerida" || gradeField.value.trim() === "") {
          throw new Error("Debe seleccionar el Grado a cursar.");
      }

      if (!relationshipField.value || relationshipField.value === "Requerida" || relationshipField.value.trim() === "") {
          throw new Error("Debe seleccionar su Parentesco con el estudiante.");
      }
      
      if (!dateField.value) throw new Error("Falta la fecha de nacimiento.");
      
      // Validación de Seguridad: Rango absoluto 11-18 años
      const fechaIngresada = dateField.value;
      if (fechaIngresada < minDateISO || fechaIngresada > maxDateISO) {
          alert("El estudiante debe tener entre 11 y 18 años de edad para poder ser inscrito.");
          return;
      }

      // La validación de edad ahora es dinámica por grado
      if (!checkAgeGradeValidity()) {
          throw new Error("El estudiante no cumple con el rango de edad permitido para el grado seleccionado.");
      }

      const cedulaValStr = ciField.value.trim();
      let finalCedulaToSubmit = cedulaValStr;
      
      if (useSchoolIdCheckbox.checked) {
          if (cedulaValStr.length < 11 || cedulaValStr.length > 12) {
              throw new Error("La Cédula Escolar generada es inválida (longitud incorrecta).");
          }
      } else {
          if (!cedulaValStr) throw new Error("Debe ingresar la Cédula de Identidad.");
          const cedulaNum = parseInt(cedulaValStr, 10);
          const isExtranjero = nacionalidadSelect.value === "E";
          
          if (isNaN(cedulaNum) || cedulaNum < 33000000) throw new Error("El número de Cédula de Identidad del estudiante debe ser mayor a 33.000.000.");
          if (!isExtranjero && cedulaNum > 40000000) throw new Error("El número de Cédula de Identidad para Venezolanos (V) no debe exceder los 40.000.000.");
          if (isExtranjero && cedulaNum > 90000000) throw new Error("El número de Cédula de Identidad para Extranjeros (E) no debe exceder los 90.000.000.");
          
          finalCedulaToSubmit = `${nacionalidadSelect.value}-${cedulaValStr}`;
      }

      document.body.appendChild(loader);
      const formData = new FormData();

      formData.append("Nombre", nombreVal);
      formData.append("Apellido", apellidoVal);
      formData.append("Genero", genderField.value);
      formData.append("Cedula", finalCedulaToSubmit);

      const dateParts = dateField.value.split("-");
      formData.append("FechaNacimiento", `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);

      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());

      if (!editId && !reinscribeId) formData.append("IdRepresentante", parentData["DatosPersonaId"]);

      const filesMap = {
        FotoCarnet: "studentPhoto",
        DocDni: "docDni",
        DocPartidaNacimiento: "docPartidaNacimiento",
        DocNotasCertificadas: "docNotasCertificadas",
        DocAutorizacion: "docAutorizacion"
      };

      for (const [key, id] of Object.entries(filesMap)) {
        const fileInput = document.getElementById(id);
        
        if (key === "DocDni" && useSchoolIdCheckbox.checked) continue;
        if (key === "DocAutorizacion" && (relationshipField.value === "Padre" || relationshipField.value === "Madre" || !relationshipField.value)) continue;

        if (fileInput && fileInput.files[0]) {
          formData.append(key, fileInput.files[0]);
        } else if (!editId && !reinscribeId) {
             if(key === "DocAutorizacion") throw new Error("Debe cargar el Documento de Autorización Legal / Motivo.");
             else if(key === "DocDni") throw new Error("Debe cargar la Cédula de Identidad en formato PDF.");
             else throw new Error(`Falta cargar el siguiente documento: ${key}.`);
        } else if (reinscribeId) {
             if (key === "DocNotasCertificadas") throw new Error("Para reinscribir, debe cargar obligatoriamente las Notas Certificadas del año que acaba de cursar.");
        }
      }

      let url = editId
        ? `${window.APP_CONFIG.api_url}/students/correct_application/${editId}`
        : reinscribeId 
          ? `${window.APP_CONFIG.api_url}/students/submit_reinscription/${reinscribeId}`
          : `${window.APP_CONFIG.api_url}/students/create`;
          
      let method = editId || reinscribeId ? "PUT" : "POST";

      let response;
      try {
        response = await fetch(url, {
          method: method,
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (networkError) {
        throw new Error("Ocurrió un error de conexión. Verifique su internet e intente nuevamente.");
      }

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Error al procesar la solicitud en el servidor.");

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", resData.message || "Operación realizada con éxito.");
      notificationsContainer.appendChild(notification);

      setTimeout(() => {
        window.location.href = "/app/representante/inicio/";
      }, 2000);
    } catch (err) {
      // AQUÍ PASAMOS EL MENSAJE POR NUESTRO FILTRO AMIGABLE
      const friendlyMessage = translateError(err.message);
      
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", friendlyMessage);
      notificationsContainer.appendChild(notification);
    } finally {
      if (document.body.contains(loader)) loader.remove();
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
            const span = zone.querySelector("span");
            if (span) {
                span.textContent = file.name;
                span.style.color = "#28a745";
                span.style.fontWeight = "bold";
            }
            zone.style.backgroundColor = "#f8fff9";
        }
        zone.style.borderColor = "#28a745";
      }
    });
    input.closest(".upload-zone")?.addEventListener("click", () => input.click());
  });
});