import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. Variables y Elementos ---
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit_id"); // Detectamos si estamos editando
  
  // --- DIAGNÓSTICO (Esto te dirá si el código funciona) ---
  if (editId) {
      console.log("✅ ID de edición encontrado:", editId);
      // alert("📝 MODO EDICIÓN DETECTADO: " + editId); // Descomenta si necesitas ver la alerta
  } else {
      console.log("ℹ️ Modo registro normal (Sin ID)");
  }
  // -------------------------------------------------------

  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("genero");
  const ciField = document.getElementById("cedula");
  const dateField = document.getElementById("fechaNac");
  const relationshipField = document.getElementById("parentesco");
  const gradeField = document.getElementById("grado");
  const addressField = document.getElementById("direccion");
  
  const hasIdCheckbox = document.getElementById("hasId");
  const idInput = document.getElementById("cedula");
  const idFormDoc = document.getElementById("IdDoc");
  
  const btnSubmit = document.getElementById("BtnSubmit");
  const formTitle = document.querySelector(".page-title h2");
  
  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";
  
  let parentData = {};

  // --- 2. Carga Inicial (Grados y Representante) ---
  try {
    document.body.appendChild(loader);
    
    // Cargar Grados
    const gradesResponse = await fetch(`${window.APP_CONFIG.api_url}/course/get_all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const grades = await gradesResponse.json();
    document.querySelectorAll(".grade-option").forEach((opt, index) => opt.value = grades[index].CursoId);

    // Cargar Representante
    const parentResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    parentData = await parentResponse.json();
    
    const countResponse = await fetch(`${window.APP_CONFIG.api_url}/students/count/by_parent`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const countData = await countResponse.json();
    parentData["students"] = countData;

    // --- 3. MODO EDICIÓN: SI HAY ID, CARGAMOS DATOS ---
    if (editId) {
        // Cambiar título y botón visualmente
        if(formTitle) formTitle.textContent = "Corregir Inscripción";
        btnSubmit.textContent = "Guardar Correcciones";
        
        // Obtener datos del estudiante
        const studentResponse = await fetch(`${window.APP_CONFIG.api_url}/students/get/${editId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!studentResponse.ok) throw new Error("No se pudo cargar la información del estudiante");
        
        const student = await studentResponse.json();
        console.log("Datos del estudiante recibidos:", student); // Para ver en consola

        // Rellenar campos (Aseguramos que student.DatosPersona existe)
        if (student.DatosPersona) {
            firstNameField.value = student.DatosPersona.Nombre || "";
            lastNameField.value = student.DatosPersona.Apellido || "";
            genderField.value = student.DatosPersona.Sexo || "";
            ciField.value = student.DatosPersona.Cedula || "";
            addressField.value = student.DatosPersona.Direccion || "";
            
            // Ajustar checkbox de cédula
            if (student.DatosPersona.Cedula) {
                hasIdCheckbox.checked = true;
                idFormDoc.style.display = "block";
            }
        }

        // Rellenar fecha
        if (student.FechaNacimiento) {
            // Intentamos convertir la fecha de forma segura
            const birthDate = new Date(student.FechaNacimiento);
            if (!isNaN(birthDate)) {
                const yyyy = birthDate.getFullYear();
                const mm = String(birthDate.getMonth() + 1).padStart(2, '0');
                const dd = String(birthDate.getDate()).padStart(2, '0');
                dateField.value = `${yyyy}-${mm}-${dd}`;
            }
        }

        relationshipField.value = student.Parentesco || "";
        if (student.Curso) {
            gradeField.value = student.Curso.CursoId || "";
        }

        // Mostrar aviso sobre archivos
        const uploadZones = document.querySelectorAll(".upload-zone span");
        uploadZones.forEach(span => {
            span.textContent = "Archivo cargado (Suba otro para reemplazar)";
            span.style.color = "#0056b3";
            span.style.fontWeight = "bold";
        });
    }

  } catch (err) {
    console.error("Error cargando datos:", err);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", "Error cargando datos: " + err.message);
    notificationsContainer.appendChild(notification);
  } finally {
    loader.remove();
  }

  // --- 4. Lógica de UI (Checkboxes) ---
  toggleInputState(idInput, !hasIdCheckbox.checked);
  hasIdCheckbox.addEventListener("change", (e) => {
    toggleInputState(idInput, !e.target.checked);
    idFormDoc.style.display = e.target.checked ? "block" : "none";
    if (e.target.checked) {
        idInput.value = "";
        idInput.focus();
    } else if (!editId) { 
        idInput.value = `${parentData["Cedula"]}${parentData["students"]["count"] + 1}`;
    }
  });

  document.getElementById("sameAddress").addEventListener("change", (e) => {
    if (e.target.checked) {
        addressField.value = parentData["Direccion"];
        addressField.readOnly = true;
    } else {
        if (!editId) addressField.value = "";
        addressField.readOnly = false;
        addressField.focus();
    }
  });

  function toggleInputState(el, disabled) {
    el.disabled = disabled;
    el.style.opacity = disabled ? "0.6" : "1";
  }

  // --- 5. ENVÍO DEL FORMULARIO (Crear O Actualizar) ---
  btnSubmit.addEventListener("click", async () => {
    try {
      // Validaciones básicas
      if (!firstNameField.value.trim()) throw new Error("Falta el nombre");
      if (!lastNameField.value.trim()) throw new Error("Falta el apellido");
      if (!genderField.value) throw new Error("Falta el género");
      if (!dateField.value) throw new Error("Falta la fecha de nacimiento");
      if (!gradeField.value) throw new Error("Falta el grado");

      document.body.appendChild(loader);
      const formData = new FormData();
      
      formData.append("Nombre", firstNameField.value.trim());
      formData.append("Apellido", lastNameField.value.trim());
      formData.append("Genero", genderField.value);
      formData.append("Cedula", ciField.value.trim());
      
      // Formato fecha DD/MM/YYYY
      const dateParts = dateField.value.split('-'); // YYYY-MM-DD
      formData.append("FechaNacimiento", `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
      
      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());
      
      // Solo en modo creación necesitamos ID del representante
      if (!editId) formData.append("IdRepresentante", parentData["DatosPersonaId"]);

      // Archivos
      const filesMap = {
          "FotoCarnet": "studentPhoto",
          "DocDni": "docDni",
          "DocPartidaNacimiento": "docPartidaNacimiento",
          "DocNotasCertificadas": "docNotasCertificadas"
      };

      for (const [key, id] of Object.entries(filesMap)) {
          const fileInput = document.getElementById(id);
          if (fileInput.files[0]) {
              formData.append(key, fileInput.files[0]);
          } else if (!editId && key !== "DocDni") {
              // Si es creación, exigimos archivos. Si es edición, son opcionales (se mantienen los viejos)
              throw new Error(`Falta cargar: ${key}`);
          }
      }

      // --- DECISIÓN CRÍTICA: ¿CREAR O ACTUALIZAR? ---
      let url, method;
      
      if (editId) {
          // MODO CORRECCIÓN (PUT)
          console.log("Enviando actualización para ID:", editId);
          url = `${window.APP_CONFIG.api_url}/students/correct_application/${editId}`;
          method = "PUT";
      } else {
          // MODO CREACIÓN (POST)
          console.log("Enviando registro nuevo");
          url = `${window.APP_CONFIG.api_url}/students/create`;
          method = "POST";
      }

      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      // Éxito
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", resData.message);
      notificationsContainer.appendChild(notification);
      
      setTimeout(() => {
          window.location.href = "/app/representante/inicio/";
      }, 2000);

    } catch (err) {
      console.error(err);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", err.message);
      notificationsContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });

  // Visual de Inputs de archivo
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const fileName = e.target.files[0]?.name;
      const zone = input.closest(".upload-zone");
      if (fileName && zone) {
        zone.querySelector("span").textContent = fileName;
        zone.style.borderColor = "#28a745";
      }
    });
    input.closest(".upload-zone")?.addEventListener("click", () => input.click());
  });
});