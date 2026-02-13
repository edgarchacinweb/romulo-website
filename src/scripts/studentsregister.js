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
  const idInput = document.getElementById("cedula");
  const idFormDoc = document.getElementById("IdDoc");

  const btnSubmit = document.getElementById("BtnSubmit");
  const formTitle = document.querySelector(".page-title h2");

  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";

  let parentData = {};

  try {
    document.body.appendChild(loader);

    // --- 2. VALIDACIÓN DE PERIODO (NUEVO) ---
    // Si NO estamos editando, verificamos si el proceso está abierto
    if (!editId) {
      const checkPeriodResponse = await fetch(
        `${window.APP_CONFIG.api_url}/students/check_period`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!checkPeriodResponse.ok) {
        // Bloquear visualmente el formulario
        const mainContainer =
          document.querySelector(".container") || document.body;
        mainContainer.innerHTML = `
                <div style="text-align:center; padding: 80px 20px; background: white; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 50px auto;">
                    <div style="font-size: 50px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="color: #dc3545; margin-bottom: 15px;">Proceso de Inscripción Cerrado</h2>
                    <p style="color: #666; line-height: 1.6;">Actualmente no hay periodos de inscripción activos en el sistema. Por favor, esté atento a los comunicados oficiales del Liceo.</p>
                    <a href="/app/representante/inicio/" style="display:inline-block; margin-top:25px; padding: 12px 25px; background: #007bff; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Volver al Inicio</a>
                </div>
            `;
        loader.remove();
        return; // Detener ejecución
      }
    }

    // --- 3. Carga Inicial (Grados y Representante) ---

    // Cargar Grados
    const gradesResponse = await fetch(
      `${window.APP_CONFIG.api_url}/course/get_all`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const grades = await gradesResponse.json();
    document.querySelectorAll(".grade-option").forEach((opt, index) => {
      if (grades[index]) opt.value = grades[index].CursoId;
    });

    // Cargar Representante
    const parentResponse = await fetch(
      `${window.APP_CONFIG.api_url}/people/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    parentData = await parentResponse.json();

    const countResponse = await fetch(
      `${window.APP_CONFIG.api_url}/students/count/by_parent`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const countData = await countResponse.json();
    parentData["students"] = countData;

    // --- 4. MODO EDICIÓN: CARGAR DATOS ---
    if (editId) {
      if (formTitle) formTitle.textContent = "Corregir Inscripción";
      btnSubmit.textContent = "Guardar Correcciones";

      const studentResponse = await fetch(
        `${window.APP_CONFIG.api_url}/students/get/${editId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!studentResponse.ok)
        throw new Error("No se pudo cargar la información del estudiante");

      const student = await studentResponse.json();

      if (student.DatosPersona) {
        firstNameField.value = student.DatosPersona.Nombre || "";
        lastNameField.value = student.DatosPersona.Apellido || "";
        genderField.value = student.DatosPersona.Sexo || "";
        ciField.value = student.DatosPersona.Cedula || "";
        addressField.value = student.DatosPersona.Direccion || "";

        if (student.DatosPersona.Cedula) {
          hasIdCheckbox.checked = true;
          idFormDoc.style.display = "block";
        }
      }

      if (student.FechaNacimiento) {
        const birthDate = new Date(student.FechaNacimiento);
        if (!isNaN(birthDate)) {
          const yyyy = birthDate.getFullYear();
          const mm = String(birthDate.getMonth() + 1).padStart(2, "0");
          const dd = String(birthDate.getDate()).padStart(2, "0");
          dateField.value = `${yyyy}-${mm}-${dd}`;
        }
      }

      relationshipField.value = student.Parentesco || "";
      if (student.Curso) gradeField.value = student.Curso.CursoId || "";

      document.querySelectorAll(".upload-zone span").forEach((span) => {
        span.textContent = "Archivo cargado (Suba otro para reemplazar)";
        span.style.color = "#0056b3";
        span.style.fontWeight = "bold";
      });
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    loader.remove();
  }

  // --- 5. Lógica de UI ---
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
    if (el) {
      el.disabled = disabled;
      el.style.opacity = disabled ? "0.6" : "1";
    }
  }

  // --- 6. ENVÍO DEL FORMULARIO ---
  btnSubmit.addEventListener("click", async () => {
    try {
      if (!firstNameField.value.trim()) throw new Error("Falta el nombre");
      if (!lastNameField.value.trim()) throw new Error("Falta el apellido");
      if (!dateField.value) throw new Error("Falta la fecha de nacimiento");

      document.body.appendChild(loader);
      const formData = new FormData();

      formData.append("Nombre", firstNameField.value.trim());
      formData.append("Apellido", lastNameField.value.trim());
      formData.append("Genero", genderField.value);
      formData.append("Cedula", ciField.value.trim());

      const dateParts = dateField.value.split("-");
      formData.append(
        "FechaNacimiento",
        `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`,
      );

      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());

      if (!editId)
        formData.append("IdRepresentante", parentData["DatosPersonaId"]);

      const filesMap = {
        FotoCarnet: "studentPhoto",
        DocDni: "docDni",
        DocPartidaNacimiento: "docPartidaNacimiento",
        DocNotasCertificadas: "docNotasCertificadas",
      };

      for (const [key, id] of Object.entries(filesMap)) {
        const fileInput = document.getElementById(id);
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
    input
      .closest(".upload-zone")
      ?.addEventListener("click", () => input.click());
  });
});
