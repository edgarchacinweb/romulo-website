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
  
  const btnSubmit = document.getElementById("BtnSubmit");
  const formTitle = document.querySelector(".page-title h2");
  
  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";
  
  let parentData = {};

  try {
    document.body.appendChild(loader);

    // --- 2. VALIDACIÓN DE PERIODO ---
    if (!editId) {
        const checkPeriodResponse = await fetch(`${window.APP_CONFIG.api_url}/students/check_period`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!checkPeriodResponse.ok) {
            const mainContainer = document.querySelector(".container") || document.body;
            mainContainer.innerHTML = `
                <div style="text-align:center; padding: 80px 20px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 50px auto;">
                    <div style="font-size: 50px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="color: #dc3545; margin-bottom: 15px;">Proceso de Inscripción Cerrado</h2>
                    <p style="color: #666; line-height: 1.6;">No hay periodos activos actualmente.</p>
                    <a href="/app/representante/inicio/" style="display:inline-block; margin-top:25px; padding: 12px 25px; background: #007bff; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Volver al Inicio</a>
                </div>
            `;
            loader.remove();
            return;
        }
    }

    // --- 3. CARGA INICIAL DE DATOS (Grados y Representante) ---
    
    // Cargamos los grados primero para que el select esté listo antes de pre-rellenar
    const gradesResponse = await fetch(`${window.APP_CONFIG.api_url}/course/get_all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const grades = await gradesResponse.json();
    
    gradeField.innerHTML = '<option value="" disabled selected>Seleccione el año</option>';
    grades.forEach(g => {
        const option = document.createElement("option");
        option.value = g.CursoId;
        option.textContent = `${g.Grado}° Año`;
        gradeField.appendChild(option);
    });

    if (
      !parentData["Telefono"] ||
      !parentData["Ocupacion"] ||
      !parentData["Direccion"]
    ) {
      alert(
        'Primero termina de llenar los datos de tu perfil en la opción "Editar Perfil"',
      );
      window.location.href = "/app/representante/editar-perfil";
      return;
    }

    const countStudents = await countStudentsResponse.json();

    // --- 4. MODO EDICIÓN: AUTO-LLENADO ---
    if (editId) {
        console.log("Iniciando carga de datos para corrección...");
        if(formTitle) formTitle.textContent = "Corregir Solicitud de Inscripción";
        btnSubmit.textContent = "Guardar Correcciones";
        
        const studentResponse = await fetch(`${window.APP_CONFIG.api_url}/students/get/${editId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!studentResponse.ok) throw new Error("No se pudo obtener la información del servidor");
        
        const student = await studentResponse.json();
        console.log("Datos recibidos:", student);

        // Mapeo de datos (Ajustado a tu Backend)
        firstNameField.value = student.Nombre || "";
        lastNameField.value = student.Apellido || "";
        genderField.value = student.Genero || "";
        ciField.value = student.Cedula || "";
        addressField.value = student.Direccion || "";
        relationshipField.value = student.Parentesco || "";
        
        // Asignar el Grado
        if (student.IdCurso) {
            gradeField.value = student.IdCurso;
        }

        // Formateo de Fecha de Nacimiento para el input type="date" (YYYY-MM-DD)
        if (student.FechaNacimiento) {
            let dateVal = student.FechaNacimiento;
            // Si la fecha viene de Postgres como DD/MM/YYYY, la convertimos
            if (dateVal.includes('/')) {
                const [d, m, y] = dateVal.split('/');
                dateVal = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (dateVal.includes(' ')) {
                // Si viene con timestamp, cortamos solo la fecha
                dateVal = dateVal.split(' ')[0];
            }
            dateField.value = dateVal.substring(0, 10);
        }

        // Si tiene cédula, mostramos el campo
        if (student.Cedula) {
            hasIdCheckbox.checked = true;
            idFormDoc.style.display = "block";
            ciField.disabled = false;
            ciField.style.opacity = "1";
        }

        // Mensaje visual para documentos
        document.querySelectorAll(".upload-zone span").forEach(span => {
            span.textContent = "Archivo cargado previamente (Suba uno nuevo para reemplazar)";
            span.style.color = "#0056b3";
            span.style.fontWeight = "bold";
        });
    }

  } catch (err) {
    console.error("Error crítico en carga:", err);
  } finally {
    if (loader) loader.remove();
  }

  // --- 5. Lógica de Interfaz ---
  hasIdCheckbox.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    ciField.disabled = !isChecked;
    ciField.style.opacity = isChecked ? "1" : "0.6";
    idFormDoc.style.display = isChecked ? "block" : "none";
    
    if (isChecked) {
        ciField.value = "";
        ciField.focus();
    } else if (!editId) { 
        ciField.value = `${parentData.Cedula}${ (parentData.students?.count || 0) + 1 }`;
    }
  });

  document.getElementById("sameAddress").addEventListener("change", (e) => {
    if (e.target.checked) {
        addressField.value = parentData.Direccion || "";
        addressField.readOnly = true;
    } else {
        addressField.readOnly = false;
        if (!editId) addressField.value = "";
        addressField.focus();
    }
  });

  // --- 6. ENVÍO DEL FORMULARIO ---
  btnSubmit.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      if (!firstNameField.value.trim() || !lastNameField.value.trim() || !dateField.value) {
          throw new Error("Por favor completa los campos obligatorios.");
      }

      document.body.appendChild(loader);
      const formData = new FormData();
      
      formData.append("Nombre", firstNameField.value.trim());
      formData.append("Apellido", lastNameField.value.trim());
      formData.append("Genero", genderField.value);
      formData.append("Cedula", ciField.value.trim());
      
      const [y, m, d] = dateField.value.split('-');
      formData.append("FechaNacimiento", `${d}/${m}/${y}`);
      
      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());
      
      if (!editId) {
          formData.append("IdRepresentante", parentData.DatosPersonaId || parentData.id);
      }

      const filesMap = {
          "FotoCarnet": "studentPhoto",
          "DocDni": "docDni",
          "DocPartidaNacimiento": "docPartidaNacimiento",
          "DocNotasCertificadas": "notas"
      };

      for (const [key, elementId] of Object.entries(filesMap)) {
          const fileInput = document.getElementById(elementId);
          if (fileInput && fileInput.files[0]) {
              formData.append(key, fileInput.files[0]);
          }
      }

      const url = editId 
        ? `${window.APP_CONFIG.api_url}/students/correct_application/${editId}` 
        : `${window.APP_CONFIG.api_url}/students/create`;
      
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", "¡Cambios guardados exitosamente!");
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
      if (loader) loader.remove();
    }
  });

  // Visual de Inputs de archivo
 // --- VISUAL DE INPUTS DE ARCHIVO (CORREGIDO) ---
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    // 1. Detectar cuando el usuario selecciona un archivo
    input.addEventListener("change", (e) => {
      const fileName = e.target.files[0]?.name;
      const zone = input.closest(".upload-zone");
      if (fileName && zone) {
        // Cambiamos el texto "Haga clic..." por el nombre del archivo
        zone.querySelector("span").textContent = fileName;
        // Cambiamos el borde a verde para indicar éxito
        zone.style.borderColor = "#28a745";
        zone.style.backgroundColor = "#f0fff4";
        // Cambiamos el icono a un check
        const icon = zone.querySelector("svg");
        if(icon) icon.style.color = "#28a745";
      }
    });

    // 2. EL PUENTE: Al hacer clic en la zona punteada, activamos el input oculto
    const zone = input.closest(".upload-zone");
    if (zone) {
      zone.addEventListener("click", (e) => {
        // Evitamos que el clic se dispare doble si le dan directo al input (poco probable pero posible)
        if (e.target !== input) {
            input.click();
        }
      });
      // Cambiamos el cursor para que se vea que es clicable
      zone.style.cursor = "pointer"; 
    }
  });
}); // <--- Fin del DOMContentLoaded