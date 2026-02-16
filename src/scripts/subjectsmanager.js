import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", async () => {
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
    if (subjects.length > 0) {
      subjectsContainer.classList.remove("hidden");
      emptyState.classList.add("hidden");
    } else {
      emptyState.classList.remove("hidden");
    }
    dynamicList.innerHTML = "";
    ["Secundaria", "Bachillerato"].forEach((level) => {
      const levelSubjects = subjects.filter((s) => s["Nivel"] === level);
      if (levelSubjects.length === 0) return;

      const groupSection = document.createElement("div");
      groupSection.classList.add("level-group");
      groupSection.innerHTML = `
                  <div class="level-header">
                      <div class="level-title">
                          <svg
                             width="20"
                             height="20"
                             viewBox="0 0 24 24"
                             fill="none"
                             stroke="#6366f1"
                             stroke-width="2"
                             stroke-linecap="round"
                             stroke-linejoin="round"
                           >
                               <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                               <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                           </svg>
                          <span>Materias de ${level}</span>
                      </div>
                      <span class="subject-count">${levelSubjects.length} Materia${levelSubjects.length > 1 ? "s" : ""}</span>
                  </div>
                  <div class="subjects-grid">
                    ${levelSubjects.reduce((accum, subject) => {
                      return (
                        accum +
                        `
                          <div class="subject-card">
                            <div class="card-info">
                              <h4>${subject["Nombre"]}</h4>
                              <span>${getCurrentDate()}</span>
                            </div>
                            <button class="btn-delete" title="Eliminar materia" data-id=${subject["MateriaId"]}>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path
                                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        `
                      );
                    }, "")}
                  </div>
              `;

      dynamicList.appendChild(groupSection);
    });

    document.querySelectorAll(".btn-delete").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const confirmation = confirm(
          "¿Estás seguro de inhabilitar esta materia?",
        );
        if (!confirmation) return;

        const notification = document.createElement("notification-component");
        loader.setAttribute("title", "Deshabilitando Materia...");
        document.body.appendChild(loader);

        try {
          const id = btn.getAttribute("data-id");
          const removeSubjectResponse = await fetch(
            `${window.APP_CONFIG.api_url}/subject/delete/${id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!removeSubjectResponse.ok) {
            const removeSubjectAnswer = await removeSubjectResponse.json();
            throw new Error(removeSubjectAnswer.message);
          }

          subjects = subjects.filter((s) => s["MateriaId"] !== id);
          renderSubjects();
          notification.setAttribute("type", "success");
          notification.setAttribute(
            "text",
            "Materia deshabilitada correctamente",
          );
        } catch (Error) {
          console.error(Error.stack);
          notification.setAttribute("type", "error");
          notification.setAttribute("text", Error.message);
        } finally {
          loader.remove();
          notifications.appendChild(notification);
        }
      }),
    );
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

  // Cargar materias ya insertadas
  loader.setAttribute("title", "Cargando Materias...");
  document.body.appendChild(loader);

  try {
    const subjectsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/subject/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const subjectsAnswer = await subjectsResponse.json();
    if (!subjectsResponse.ok) throw new Error(subjectsAnswer.message);

    subjects = [...subjectsAnswer];
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
