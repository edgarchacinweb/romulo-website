import authorize from "./auth.js";

authorize("administrador");

const token = localStorage.getItem("auth");
let teachers = [];

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
let subjectsSelectHtml = "";

const addTeacherCard = (teacher) => {
  const teachersCardContainer = document.getElementById("teacher-list");
  const card = document.createElement("div");
  card.classList.add("teacher-card");
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
          <span class="value">+${teacher["DatosPersona"]["Telefono"]}</span>
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
    subjectField.innerHTML = subjectsSelectHtml;
    const phone = teacher["DatosPersona"]["Telefono"].split("-");
    document.getElementById("submit-btn").textContent = "Actualizar docente";

    firstNameField.value = teacher["DatosPersona"]["Nombre"];
    lastNameField.value = teacher["DatosPersona"]["Apellido"];
    identityField.value = teacher["DatosPersona"]["Cedula"];
    ocupationField.value = teacher["DatosPersona"]["Ocupacion"];
    emailField.value = teacher["Usuario"]["Email"];
    hoursField.value = parseInt(teacher["HorasAcademicas"]);
    locationField.value = teacher["DatosPersona"]["Direccion"];
    phonePrefixField.value = phone[0];
    phoneField.value = phone[1];
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const notificationContainer = document.getElementById("notifications");
  const addSubjectBtn = document.getElementById("agregar-materia");
  let selectedSubjects = [];

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);

  addSubjectBtn.addEventListener("click", () => {
    if (subjectField.options.length === 1)
      addSubjectBtn.classList.add("disabled");
      
    const selectedElement = subjectField.options[subjectField.selectedIndex];
    const id = subjectField.value;
    const subjectFullText = selectedElement.textContent; // Ej: "Matemáticas - Secundaria"
    
    // SOLUCIÓN: Separamos el Nombre de la materia y el Nivel
    // asumiendo que el texto viene en formato "Nombre - Nivel"
    const [subjectName, subjectLevel] = subjectFullText.split(" - ");
    
    selectedElement.remove();
    
    // Ahora guardamos tanto el Nombre como el Nivel por separado
    selectedSubjects.push({ 
        MateriaId: id, 
        Nombre: subjectName, 
        Nivel: subjectLevel || "" 
    });
    
    const newSubject = document.createElement("p");
    newSubject.textContent = subjectFullText;
    newSubject.classList.add("materia");
    subjectsContainer.appendChild(newSubject);
    console.log(selectedSubjects);

    newSubject.addEventListener("click", () => {
      const newOption = document.createElement("option");
      newOption.setAttribute("value", id);
      newOption.textContent = subjectFullText;
      subjectField.appendChild(newOption);
      newSubject.remove();
      selectedSubjects = selectedSubjects.filter(
        (subject) => subject["MateriaId"] !== id,
      );
      if (addSubjectBtn.classList.contains("disabled"))
        addSubjectBtn.classList.remove("disabled");
    });
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
    teachers = [...teachersData];
    const activeTeachers = document.getElementById("active-teachers");
    activeTeachers.textContent = teachers.length;
    teachers.forEach((teacher) => {
      addTeacherCard(teacher);
    });
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
    const subjects = await subjectsResponse.json();
    const subjectList = document.getElementById("materia");
    subjectList.firstElementChild.remove();

    subjects.forEach((s) => {
      const subject = document.createElement("option");
      subject.setAttribute("value", s["MateriaId"]);
      subject.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
      subjectList.appendChild(subject);
    });

    subjectsSelectHtml = subjectList.innerHTML;
  }

  loader.remove();

  // Guardando docente
  document.getElementById("submit-btn").addEventListener("click", async () => {
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

    loader.setAttribute("title", "Registrando docente...");
    document.body.appendChild(loader);

    try {
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
        throw new Error(
          "El apellido del docente presenta un formato inválido.",
        );
      } else if (!gender) {
        genderField.focus();
        throw new Error("Debes especificar el género del docente");
      } else if (!identity) {
        identityField.focus();
        throw new Error("Debes especificar la cédula de identidad del docente");
      } else if (
        !new RegExp(/\d{7}|\d{8}/).test(identity) ||
        identity < 100000
      ) {
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

      const peopleData = {
        Nombre: firstName,
        Apellido: lastName,
        Sexo: gender,
        Cedula: identity,
        Telefono: `${phonePrefix}-${phone}`,
        Ocupacion: occupation,
        Direccion: location,
      };

      const registerTeacherResponse = await fetch(
        `${window.APP_CONFIG.api_url}/teacher/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...peopleData,
            Materias: selectedSubjects.map((s) => s["MateriaId"]),
            Email: email,
            Horas: hours,
          }),
        }
      );

      const registerTeacherAnswer = await registerTeacherResponse.json();

      if (!registerTeacherResponse.ok) {
        throw new Error(registerTeacherAnswer.message);
      }

      addTeacherCard({
        DatosPersona: { ...peopleData },
        HorasAcademicas: hours,
        Materias: selectedSubjects,
        DocenteId: registerTeacherAnswer["DocenteId"],
        Usuario: {
          Email: email,
        },
      });

      const teachersCounter = document.getElementById("active-teachers");
      teachersCounter.textContent = parseInt(teachersCounter.textContent) + 1;

      teacherForm.reset();
      subjectsContainer.querySelectorAll("p").forEach((p) => p.remove());
      selectedSubjects.forEach((s) => {
        const subjectOption = document.createElement("option");
        subjectOption.setAttribute("value", s["MateriaId"]);
        subjectOption.textContent = `${s["Nombre"]} - ${s["Nivel"]}`;
        subjectField.appendChild(subjectOption);
      });

      selectedSubjects = [];

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