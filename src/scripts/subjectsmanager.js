import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // Referencias al DOM
  const nameInput = document.getElementById("subjectName");
  const levelSelect = document.getElementById("educationLevel");
  const emptyState = document.getElementById("emptyState");
  const subjectsContainer = document.getElementById("subjectsContainer");
  const dynamicList = document.getElementById("dynamicList");
  const successAlert = document.getElementById("successAlert");
  const alertMessage = document.getElementById("alertMessage");
  const loader = document.createElement("loader-spinner");
  const notifications = document.getElementById("notifications");
  const addSubjectBtn = document.getElementById("AddSubjectBtn");

  // Estado de la aplicación (Lista de materias)
  let subjects = [];

  // Función para obtener la fecha actual formateada (ej: 15 de febrero de 2026)
  const getCurrentDate = () => {
    const date = new Date();
    const options = { day: "numeric", month: "long", year: "numeric" };
    return `Agregado el ${date.toLocaleDateString("es-VE", options)}`;
  };

  // Función principal para renderizar la lista
  const renderSubjects = () => {
    dynamicList.innerHTML = "";

    // Manejo del estado vacío
    if (subjects.length === 0) {
      emptyState.classList.remove("hidden");
      subjectsContainer.classList.add("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    subjectsContainer.classList.remove("hidden");

    // Agrupar materias por nivel educativo
    // Creamos un objeto donde las claves son los niveles
    const grouped = subjects.reduce((acc, subject) => {
      if (!acc[subject.level]) {
        acc[subject.level] = [];
      }
      acc[subject.level].push(subject);
      return acc;
    }, {});

    // Iterar sobre los grupos y crear el HTML
    for (const [level, items] of Object.entries(grouped)) {
      const groupSection = document.createElement("div");
      groupSection.className = "level-group";

      // Header del grupo (Nivel + Contador)
      const countText = `${items.length} materia${items.length !== 1 ? "s" : ""}`;

      // Icono de birrete para el título de sección
      const iconHat = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`;

      groupSection.innerHTML = `
                <div class="level-header">
                    <div class="level-title">
                        ${iconHat}
                        <span>Educación ${level}</span>
                    </div>
                    <span class="subject-count">${countText}</span>
                </div>
                <div class="subjects-grid" id="grid-${level}"></div>
            `;

      dynamicList.appendChild(groupSection);

      // Insertar tarjetas en el grid correspondiente
      const grid = groupSection.querySelector(`#grid-${level}`);

      items.forEach((subject) => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.innerHTML = `
                    <div class="card-info">
                        <h4>${subject.name}</h4>
                        <span>${subject.date}</span>
                    </div>
                    <button class="btn-delete" title="Eliminar materia">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                `;
        grid.appendChild(card);
      });
    }
  };

  const enableBtn = () => {
    addSubjectBtn.setAttribute("disabled", "");
    const name = nameInput.value.trim();
    if (
      !name.length > 3 ||
      name.length > 20 ||
      !new RegExp(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{3,}(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{3,})*$/,
      ).test(name)
    )
      return;

    addSubjectBtn.removeAttribute("disabled");
  };

  nameInput.addEventListener("change", enableBtn);
  nameInput.addEventListener("keyup", enableBtn);

  // Manejador del envío del formulario
  addSubjectBtn.addEventListener("click", (e) => {
    loader.setAttribute("title", "Registrando Materia...");

    try {
      const name = nameInput.value.trim();
      const level = levelSelect.value;

      if (name.length === 0) {
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "warning");
        notification.setAttribute(
          "text",
          "Debes indicar el nombre de la materia",
        );
        notifications.appendChild(notification);
        nameInput.focus();
        return;
      } else if (
        !new RegExp(
          /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{3,}(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{3,})*$/,
        ).test(name)
      ) {
        nameInput.focus();
        throw new Error("El nombre de la materia tiene un formato inválido");
      } else if (name.length > 20) {
        nameInput.focus();
        throw new Error(
          "El nombre de la materia es demasiado largo. Límite máximo: 20 caracteres",
        );
      }

      // Crear nueva materia
      const newSubject = {
        id: Date.now(), // ID único basado en timestamp
        name: name,
        level: level,
        date: getCurrentDate(),
      };

      subjects.push(newSubject);

      // Mostrar notificación
      alertMessage.textContent = `${name} agregada a ${level}`;
      successAlert.classList.remove("hidden");

      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        successAlert.classList.add("hidden");
      }, 3000);

      // Limpiar input y renderizar
      nameInput.value = "";
      nameInput.focus();
      renderSubjects();
    } catch (Error) {
      console.log(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notifications.appendChild(notification);
    } finally {
      loader.remove();
    }
  });
});

document.getElementById("BtnBack").addEventListener("click", () => {
  document.body.style.overflow = "hidden";
  document.body.style.animation = "goodByePage 0.8s forwards";
  setTimeout(() => (window.location.href = "/app/admin/dashboard/"), 1000);
});
