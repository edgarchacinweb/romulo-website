import authorize from "./auth.js";

authorize("administrador");

const token = localStorage.getItem("auth");
let teachers = [];
let currentSearchQuery = ""; // Control de búsqueda actual de texto
let currentSubjectFilter = ""; // Control del filtro de materia

const teacherForm = document.getElementById("teacher-form");
const firstNameField = document.getElementById("nombre");
const lastNameField = document.getElementById("apellido");
const genderField = document.getElementById("sexo");
const identityField = document.getElementById("cedula");
const phoneField = document.getElementById("telefono");
const phonePrefixField = document.getElementById("prefijo");
const ocupationField = document.getElementById("ocupacion");
const subjectField = document.getElementById("materia");
const subjectsContainer = document.querySelector(".materias-seleccionadas");
const hoursField = document.getElementById("horas");
const emailField = document.getElementById("correo");
const locationField = document.getElementById("direccion");
const addSubjectBtn = document.getElementById("agregar-materia");
const submitBtn = document.getElementById("submit-btn");
const exportBtn = document.getElementById("export-btn");
const stateField = document.getElementById("estado");
let selectedTeacherId = "";

let subjectsSelectHtml = "";
let selectedSubjects = [];
let subjects = [];

const validations = () => {
  const firstName = firstNameField.value?.trim();
  const lastName = lastNameField.value?.trim();
  const gender = genderField.value;
  const identity = identityField.value?.trim();
  const phone = phoneField.value;
  const phonePrefix = phonePrefixField.value;
  const occupation = ocupationField.value?.trim();
  const hours = hoursField.value;
  const email = emailField.value?.trim();
  const location = locationField.value?.trim();

  if (!firstName || firstName.length === 0) {
    firstNameField.focus();
    throw new Error("Debes indicar el nombre del docente");
  } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(firstName)) {
    firstNameField.focus();
    throw new Error("El nombre del docente presenta un formato inválido.");
  } else if (!lastName || lastName.length === 0) {
    lastNameField.focus();
    throw new Error("Debes indicar el apellido del docente");
  } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(lastName)) {
    lastName.focus();
    throw new Error("El apellido del docente presenta un formato inválido.");
  } else if (!gender) {
    genderField.focus();
    throw new Error("Debes especificar el género del docente");
  } else if (!identity) {
    identityField.focus();
    throw new Error("Debes especificar la cédula de identidad del docente");
  } else if (!new RegExp(/\d{7}|\d{8}/).test(identity) || identity < 100000) {
    identityField.focus();
    throw new Error("Formato de cédula de identidad inválido.");
  } else if (!phonePrefix) {
    phonePrefixField.focus();
    throw new Error("Debes indicar el prefijo telefónico del docente.");
  } else if (!phone) {
    phoneField.focus();
    throw new Error("Debes indicar el teléfono del docente.");
  } else if (
    !new RegExp(/^(0412|0414|0416|0422|0424|0426)-\d{7}$/).test(
      `${phonePrefix}-${phone}`,
    )
  ) {
    phoneField.focus();
    throw new Error("El número de teléfono presenta un formato inválido");
  } else if (!occupation) {
    ocupationField.focus();
    throw new Error("Debes indicar la especialidad del docente");
  } else if (
    !new RegExp(
      /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s?[a-zA-ZÀ-ÿ\u00f1\u00d1\.\-]+)*$/,
    ).test(occupation)
  ) {
    ocupationField.focus();
    throw new Error(
      "La especialidad del docente presenta un formato inválido.",
    );
  } else if (!hours) {
    hoursField.focus();
    throw new Error(
      "Debes indicar las horas académicas semanales que impartirá el docente",
    );
  } else if (!new RegExp(/\d[20-40]/).test(hours)) {
    hoursField.focus();
    throw new Error("Formato de horas académicas semanales inválido.");
  } else if (!email) {
    emailField.focus();
    throw new Error("Debes indicar el correo electrónico del docente.");
  } else if (!new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
    emailField.focus();
    throw new Error("Formato de correo electrónico inválido");
  } else if (!location) {
    locationField.focus();
    throw new Error("Debes indicar la dirección de habitación del docente");
  } else if (
    !new RegExp(
      /^[a-zA-Z0-9À-ÿ\u00f1\u00d1][a-zA-Z0-9À-ÿ\u00f1\u00d1\s\.,#\-\/°\(\)]{4,254}$/,
    ).test(location)
  ) {
    locationField.focus();
    throw new Error("Formato de dirección de habitación inválido.");
  } else if (selectedSubjects.length === 0) {
    subjectField.focus();
    throw new Error(
      "Debes seleccionar al menos una materia que impartirá el docente.",
    );
  }
};

const addRemoveListener = (newSubject, subject) => {
  newSubject.addEventListener("click", () => {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", subject["MateriaId"]);
    newOption.textContent = `${subject["Nombre"]} - ${subject["Nivel"]}`;
    subjectField.appendChild(newOption);
    newSubject.remove();
    selectedSubjects = selectedSubjects.filter(
      (s) => s["MateriaId"] !== subject["MateriaId"],
    );
    if (addSubjectBtn.classList.contains("disabled"))
      addSubjectBtn.classList.remove("disabled");
  });
};

const addTeacherCard = (teacher) => {
  const teachersCardContainer = document.getElementById("teacher-list");
  const card = document.createElement("div");
  card.classList.add("teacher-card");
  if (!teacher["Activo"]) card.classList.add("inactive");
  card.innerHTML = `
    <div class="card-header">
    <div class="avatar-box">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
    <h2>${teacher["DatosPersona"]["Nombre"]} ${teacher["DatosPersona"]["Apellido"]}</h2>
  </div>

  <div class="card-body">
    <ul class="info-list">
      
      <li class="info-item divider">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
            <line x1="7" y1="8" x2="11" y2="8"></line>
            <line x1="7" y1="12" x2="17" y2="12"></line>
            <line x1="7" y1="16" x2="13" y2="16"></line>
            <circle cx="15" cy="8" r="1.5"></circle>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Cédula de Identidad</span>
          <span class="value">V-${teacher["DatosPersona"]["Cedula"]}</span>
        </div>
      </li>

      <li class="info-item divider">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Teléfono</span>
          <span class="value">${teacher["DatosPersona"]["Telefono"]}</span>
        </div>
      </li>

      <li class="info-item divider">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 0v2h2.586l-2.113 2.113c-.981-.698-2.177-1.113-3.473-1.113-2.22 0-4.144 1.216-5.18 3.009-3.229.096-5.82 2.738-5.82 5.991 0 2.973 2.164 5.433 5 5.91v2.09h-3v2h3v2h2v-2h3v-2h-3v-2.09c1.791-.301 3.294-1.403 4.167-2.918 3.235-.09 5.833-2.735 5.833-5.992 0-1.296-.415-2.492-1.113-3.473l2.113-2.113v2.586h2v-6h-6zm-3 13c-1.944 0-3.564-1.396-3.923-3.236-.66-.333-1.365-.346-2.033-.066.266 2.293 1.827 4.181 3.931 4.938-.729.831-1.784 1.364-2.975 1.364-2.206 0-4-1.794-4-4s1.794-4 4-4c1.937 0 3.555 1.384 3.921 3.214.679.35 1.309.383 2.033.077-.27-2.293-1.837-4.179-3.943-4.931.732-.83 1.797-1.36 2.989-1.36 2.206 0 4 1.794 4 4s-1.794 4-4 4z"/>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Género</span>
          <span class="value">${teacher["DatosPersona"]["Sexo"]}</span>
        </div>
      </li>

      <li class="info-item divider">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Correo Electrónico</span>
          <span class="value">${teacher["Usuario"]["Email"]}</span>
        </div>
      </li>

      <li class="info-item divider">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Ubicación</span>
          <span class="value">${teacher["DatosPersona"]["Direccion"]}</span>
        </div>
      </li>

      <li class="info-item">
        <div class="icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="text-box">
          <span class="label">Horas Semanales</span>
          <span class="value">${teacher["HorasAcademicas"]} horas</span>
        </div>
      </li>
    </ul>

    <div class="subjects-section">
      <div class="subjects-header">
        <div class="icon-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
          </svg>
        </div>
        <span>Materias que Imparte</span>
      </div>

      <div class="subjects-list">
        ${teacher["Materias"].reduce((prev, current) => {
    return (
      prev +
      `
          <div class="subject-item ${current["Nivel"].toLowerCase() === "secundaria" ? "subject-blue" : "subject-purple"}">
            <span class="subject-name">${current["Nombre"]}</span>
            <span class="badge">${current["Nivel"]}</span>
          </div>
          `
    );
  }, "")}
      </div>
    </div>
  </div>
  `;
  teachersCardContainer.appendChild(card);

  card.addEventListener("click", async () => {
    firstNameField.focus();
    selectedTeacherId = teacher["DocenteId"];
    document.querySelectorAll(".materia").forEach((m) => m.remove());
    subjectField.innerHTML = subjectsSelectHtml;
    const phone = teacher["DatosPersona"]["Telefono"].split("-");
    submitBtn.textContent = "Actualizar docente";
    submitBtn.setAttribute("data-update", "");
    document.querySelector(".hidden").classList.remove("hidden");

    firstNameField.value = teacher["DatosPersona"]["Nombre"];
    lastNameField.value = teacher["DatosPersona"]["Apellido"];
    identityField.value = teacher["DatosPersona"]["Cedula"];
    genderField.value = teacher["DatosPersona"]["Sexo"];
    ocupationField.value = teacher["DatosPersona"]["Ocupacion"];
    emailField.value = teacher["Usuario"]["Email"];
    hoursField.value = parseInt(teacher["HorasAcademicas"]);
    locationField.value = teacher["DatosPersona"]["Direccion"];
    phonePrefixField.value = phone[0];
    phoneField.value = phone[1];
    stateField.value = `${teacher["Activo"]}`;

    selectedSubjects = teacher["Materias"].map((m) => ({
      MateriaId: m["MateriaId"],
      Nombre: m["Nombre"],
    }));

    teacher["Materias"].forEach((s) => {
      const newSubject = document.createElement("p");
      newSubject.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
      newSubject.classList.add("materia");
      subjectsContainer.appendChild(newSubject);
      addRemoveListener(newSubject, s);
    });

    Array.from(subjectField.options).forEach((s) => {
      if (teacher["Materias"].find((m) => m["MateriaId"] === s.value))
        s.remove();
    });
  });

  // Agregando reporte (la actualización del contador se maneja centralizadamente)
  if (!teacher["Activo"]) return;
  const report = document.createElement("article");
  report.classList.add("teacher-card");
  report.innerHTML = `
  <header class="card-header">
    <div class="header-left">
        <div class="name-id-row">
            <h3 class="teacher-name">${teacher["DatosPersona"]["Nombre"]} ${teacher["DatosPersona"]["Apellido"]}</h3>
            <span class="badge id-badge">Cédula: V-${teacher["DatosPersona"]["Cedula"]}</span>
        </div>
        <p class="teacher-status">Docente Activo | ${teacher["DatosPersona"]["Cedula"]}</p>
    </div>
    <div class="header-right">
        <div class="hours-val">${teacher["HorasAcademicas"]}h/sem</div>
        <div class="hours-label">Horas semanales</div>
    </div>
  </header>

  <hr class="card-divider">

  <div class="contact-info">
    <div class="info-group">
        <span class="info-label">TELÉFONO</span>
        <span class="info-value">${teacher["DatosPersona"]["Telefono"]}</span>
    </div>
    <div class="info-group">
        <span class="info-label">CORREO ELECTRÓNICO</span>
        <span class="info-value">${teacher["Usuario"]["Email"]}</span>
    </div>
    <div class="info-group full-width">
        <span class="info-label">DIRECCIÓN DE VIVIENDA</span>
        <span class="info-value">${teacher["DatosPersona"]["Direccion"]}</span>
    </div>
  </div>

  <hr class="card-divider">

  <div class="subjects-section">
      <span class="info-label">MATERIAS QUE IMPARTE</span>
      <ul class="subjects-list">
          ${teacher.Materias.reduce((prev, current) => {
    return (
      prev +
      `
            <li class="subject-item">
                <span class="subject-name">${current["Nombre"]}</span>
                <span class="badge badge-highschool">${current["Nivel"]}</span>
            </li>
            `
    );
  }, "")}
      </ul>
  </div>
  `;

  document.getElementById("report").appendChild(report);
};

// --- RENDERIZACIÓN CENTRALIZADA ---
const renderTeachers = (teachersData) => {
  const teachersCardContainer = document.getElementById("teacher-list");
  teachersCardContainer.innerHTML = "";

  // Limpiamos los reportes viejos generados dinámicamente
  const reportContainer = document.getElementById("report");
  const reportCards = reportContainer.querySelectorAll("article.teacher-card");
  reportCards.forEach((card) => card.remove());

  if (teachersData.length === 0) {
    teachersCardContainer.innerHTML = `<p style="text-align:center; color:#666; width:100%; padding: 2rem 0;">No se encontraron docentes.</p>`;
  }

  // Actualizamos contadores 
  const activeCount = teachersData.filter((t) => t.Activo).length;
  const activeTeachers = document.getElementById("active-teachers");
  
  activeTeachers.textContent = (currentSearchQuery !== "" || currentSubjectFilter !== "") 
        ? `${activeCount} (Filtrados)` 
        : activeCount;

  document.getElementById("teachers-count").textContent = `(${activeCount})`;
  
  if (teachersData.length > 0) exportBtn.removeAttribute("disabled");
  else exportBtn.setAttribute("disabled", true);

  teachersData.forEach((teacher) => {
    addTeacherCard(teacher);
  });
};

// --- LÓGICA COMPLETA DE FILTRADO (TEXTO + MATERIA) ---
const applyFilterAndRender = () => {
  let filtered = teachers;

  // 1. Filtro por Búsqueda de Texto
  if (currentSearchQuery) {
    const query = currentSearchQuery.toLowerCase();
    filtered = filtered.filter((t) => {
      const { DatosPersona } = t;
      const nameMatch = (DatosPersona.Nombre || "").toLowerCase().includes(query);
      const lastNameMatch = (DatosPersona.Apellido || "").toLowerCase().includes(query);
      const fullNameMatch = `${DatosPersona.Nombre} ${DatosPersona.Apellido}`.toLowerCase().includes(query);
      const cedulaMatch = (DatosPersona.Cedula || "").toString().toLowerCase().includes(query);

      return nameMatch || lastNameMatch || fullNameMatch || cedulaMatch;
    });
  }

  // 2. Filtro por Selección de Materia
  if (currentSubjectFilter) {
    filtered = filtered.filter((t) => {
      // Retorna true si el docente imparte alguna materia cuyo ID coincida con el seleccionado
      return t.Materias.some(m => m.MateriaId === currentSubjectFilter);
    });
  }

  renderTeachers(filtered);
};


document.addEventListener("DOMContentLoaded", async () => {
  const notificationContainer = document.getElementById("notifications");

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);

  // --- EVENTOS DE BÚSQUEDA Y FILTROS ---
  const searchInput = document.getElementById("searchInput");
  const subjectFilterSelect = document.getElementById("subjectFilter");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim();
      applyFilterAndRender();
    });
  }

  if (subjectFilterSelect) {
    subjectFilterSelect.addEventListener("change", (e) => {
      currentSubjectFilter = e.target.value;
      applyFilterAndRender();
    });
  }

  addSubjectBtn.addEventListener("click", () => {
    if (subjectField.options.length === 1)
      addSubjectBtn.classList.add("disabled");

    const selectedElement = subjectField.options[subjectField.selectedIndex];
    const id = subjectField.value;
    const subjectFullText = selectedElement.textContent; // Ej: "Matemáticas - Secundaria"

    const [subjectName, subjectLevel] = subjectFullText.split(" - ");

    selectedElement.remove();

    selectedSubjects.push({
      MateriaId: id,
      Nombre: subjectName,
      Nivel: subjectLevel || ""
    });

    const newSubject = document.createElement("p");
    newSubject.textContent = subjectFullText;
    newSubject.classList.add("materia");
    subjectsContainer.appendChild(newSubject);

    addRemoveListener(
      newSubject,
      subjects.find((s) => s["MateriaId"] === id),
    );
  });

  // Cargando cantidad de docentes activos
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);
  try {
    const teachersResponse = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const teachersData = await teachersResponse.json();
    if (!teachersResponse.ok) throw new Error(teachersData.message);
    
    // Asignamos a la variable global y renderizamos
    teachers = [...teachersData];
    applyFilterAndRender();

  } catch (Error) {
    console.log(Error);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationContainer.appendChild(notification);
  } finally {
    loader.remove();
  }

  // Cargando materias disponibles
  const subjectsResponse = await fetch(
    `${window.APP_CONFIG.api_url}/subject/list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (subjectsResponse.status !== 200) {
    const subjectErrorNotification = document.createElement(
      "notification-component",
    );
    subjectErrorNotification.setAttribute("type", "error");
    subjectErrorNotification.setAttribute(
      "text",
      "Error al cargar las materias...",
    );
    notificationContainer.appendChild(subjectErrorNotification);
  } else {
    const subjectsData = await subjectsResponse.json();
    subjects = [...subjectsData];
    const subjectList = document.getElementById("materia");
    subjectList.firstElementChild.remove();

    subjectsData.forEach((s) => {
      // 1. Agregar a la lista desplegable del formulario de creación
      const subjectOption = document.createElement("option");
      subjectOption.setAttribute("value", s["MateriaId"]);
      subjectOption.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
      subjectList.appendChild(subjectOption);

      // 2. Agregar a la lista desplegable del filtro de búsqueda
      if (subjectFilterSelect) {
        const filterOption = document.createElement("option");
        filterOption.setAttribute("value", s["MateriaId"]);
        filterOption.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
        subjectFilterSelect.appendChild(filterOption);
      }
    });

    subjectsSelectHtml = subjectList.innerHTML;
  }

  loader.remove();

  // Guardando docente
  submitBtn.addEventListener("click", async (e) => {
    const firstName = firstNameField.value?.trim();
    const lastName = lastNameField.value?.trim();
    const gender = genderField.value;
    const identity = identityField.value?.trim();
    const phone = phoneField.value;
    const phonePrefix = phonePrefixField.value;
    const occupation = ocupationField.value?.trim();
    const hours = hoursField.value;
    const email = emailField.value?.trim();
    const location = locationField.value?.trim();
    const state = stateField.value;

    loader.setAttribute("title", "Registrando docente...");
    document.body.appendChild(loader);

    try {
      validations();

      const peopleData = {
        Nombre: firstName,
        Apellido: lastName,
        Sexo: gender,
        Cedula: identity,
        Telefono: `${phonePrefix}-${phone}`,
        Ocupacion: occupation,
        Direccion: location,
      };

      const updateAttribute = e.target.getAttribute("data-update") !== null;

      const registerTeacherResponse = await fetch(
        `${window.APP_CONFIG.api_url}/teacher/${updateAttribute ? "update/" + selectedTeacherId : "create"}`,
        {
          method: updateAttribute ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...peopleData,
            Materias: selectedSubjects.map((s) => s["MateriaId"]),
            Email: email,
            Horas: hours,
            Activo: state.toLowerCase() === "true",
          }),
        }
      );

      const registerTeacherAnswer = await registerTeacherResponse.json();

      if (!registerTeacherResponse.ok) {
        throw new Error(registerTeacherAnswer.message);
      }

      if (updateAttribute) {
        window.location.reload(); 
      } else {
        teachers.push({
          DatosPersona: { ...peopleData },
          HorasAcademicas: hours,
          Materias: selectedSubjects,
          DocenteId: registerTeacherAnswer["DocenteId"],
          Usuario: {
            Email: email,
          },
          Activo: state.toLowerCase() === "true"
        });

        applyFilterAndRender();
      }

      teacherForm.reset();
      subjectsContainer.querySelectorAll("p").forEach((p) => p.remove());
      selectedSubjects.forEach((s) => {
        const subjectOption = document.createElement("option");
        subjectOption.setAttribute("value", s["MateriaId"]);
        subjectOption.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
        subjectField.appendChild(subjectOption);
      });

      selectedSubjects = [];
      exportBtn.removeAttribute("disabled");

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", "Docente registrado correctamente");
      notificationContainer.appendChild(notification);
    } catch (Error) {
      console.error(Error);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });
});

document.getElementById("BtnBack").addEventListener("click", (event) => {
  event.preventDefault();
  document.body.style.animation = "goodByePage 0.8s forwards";
  console.log(event);

  setTimeout(() => (window.location.href = event.target.href), 1000);
});

document
  .getElementById("export-btn")
  .addEventListener("click", () => window.print());