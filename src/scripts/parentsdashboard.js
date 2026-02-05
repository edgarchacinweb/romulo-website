import authorize from "./auth.js";

authorize("representante");

function calcularEdadExacta(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  // 1. Diferencia inicial de años
  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  // 2. Ajuste por mes
  const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();

  // 3. Si el mes actual es menor al de nacimiento,
  // o es el mismo mes pero el día actual es menor al de nacimiento:
  // Aún no ha cumplido años este año.
  if (
    diferenciaMeses < 0 ||
    (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return edad;
}

document.addEventListener("DOMContentLoaded", async () => {
  const cardContainer = document.getElementById("card-container");
  const notificationsContainer = document.getElementById("notifications");
  const token = localStorage.getItem("auth");

  try {
    // Cargando datos del representante
    const parentDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/people/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const parentData = await parentDataResponse.json();
    if (!parentDataResponse.ok) throw new Error(parentData.message);

    // Cargando datos de los representantes
    const studentsDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/students/by_parent/${parentData.DatosPersonaId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const studentsData = await studentsDataResponse.json();
    if (!studentsDataResponse.ok) throw new Error(studentsData.message);

    studentsData.forEach((student) => {
      const card = document.createElement("div");
      const gender =
        student.DatosPersona.Sexo === "Femenino" ? "female" : "male";
      const birthdate = new Date(student.FechaNacimiento);

      card.classList.add("card");
      card.innerHTML = `
                  <section class="card__student">
              <div class="card__image card__image--${gender}">
                <img
                  class="card__photo"
                  src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student.EstudianteId}.webp"
                  alt="Foto de estudiante"
                />
              </div>

              <h3 class="card__name">${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}</h3>
              <span class="card__identity">V-${student.DatosPersona.Cedula}</span>
            </section>

            <section class="card__data card__data--${gender}">
              <div class="card__section">
                <div class="card__field">
                  <div class="field__title">
                    <svg
                      class="field__icon"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M4 9v-1.974h2v1.974h5v-4h2v4h5v-2h2v2h.755c1.803.091 3.243 1.646 3.243 3.519 0 .961-.382 1.829-.998 2.458v9.023h-22v-9.02c-.43-.438-.747-.993-.9-1.621-.067-.276-.1-.558-.1-.841 0-2.009 1.629-3.479 3.242-3.518h.758zm17 11h-18v2h18v-2zm-18-4.027v2.027h18v-2.027l-.407.025c-.775 0-1.541-.27-2.154-.79-.576.488-1.333.789-2.155.789-.812 0-1.566-.295-2.142-.779-.581.487-1.341.78-2.136.78-.807 0-1.575-.292-2.149-.78-.586.491-1.346.78-2.137.78-.775 0-1.526-.26-2.16-.79-.561.479-1.328.79-2.154.79l-.406-.025zm.29-4.973c-.627.049-1.243.635-1.288 1.421-.051.887.632 1.585 1.454 1.576 1.176-.014 1.915-.86 2.117-1.997.217.88.986 1.975 2.145 1.996 1.156.021 1.99-.959 2.161-1.958l.008-.038c.199 1.04.99 1.996 2.109 1.996 1.155 0 1.917-.872 2.172-1.996.248 1.138 1.035 1.994 2.117 1.997 1.108.003 1.955-.928 2.203-1.997.188.828.804 1.985 2.051 1.998.759.008 1.46-.65 1.46-1.483 0-.837-.649-1.481-1.318-1.517l-17.391.002zm.863-4.451c-1.897-.621-1.351-3.444.89-4.523.08 1.422 1.957 1.566 1.957 3.002 0 .602-.441 1.274-1.084 1.521.154-.509-.186-1.416-.88-1.809-.702.407-1.063 1.302-.883 1.809zm13.999-.026c-1.896-.621-1.35-3.444.891-4.523.08 1.422 1.957 1.566 1.957 3.002 0 .602-.441 1.274-1.084 1.521.153-.509-.186-1.416-.88-1.809-.702.407-1.063 1.302-.884 1.809zm-6.999-2c-1.897-.621-1.351-3.444.89-4.523.08 1.422 1.957 1.566 1.957 3.002 0 .602-.441 1.274-1.084 1.521.153-.509-.186-1.416-.88-1.809-.702.407-1.063 1.302-.883 1.809z"
                      />
                    </svg>
                    <h4 class="field__legend">Nacimiento</h4>
                  </div>
                  <span class="field__content">${birthdate.getDay() < 10 ? "0" : ""}${birthdate.getDay()}/${birthdate.getMonth() < 10 ? "0" : ""}${birthdate.getMonth()}/${birthdate.getFullYear()}</span>
                </div>
                <div class="card__field">
                  <div class="field__title">
                    <svg
                      class="field__icon"
                      fill="none"
                      stroke="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17 1c0-.552-.447-1-1-1s-1 .448-1 1v2c0 .552.447 1 1 1s1-.448 1-1v-2zm-12 2c0 .552-.447 1-1 1s-1-.448-1-1v-2c0-.552.447-1 1-1s1 .448 1 1v2zm13 5v10h-16v-10h16zm2-6h-2v1c0 1.103-.897 2-2 2s-2-.897-2-2v-1h-8v1c0 1.103-.897 2-2 2s-2-.897-2-2v-1h-2v18h20v-18zm4 3v19h-22v-2h20v-17h2zm-17 7h-2v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4h-2v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"
                      />
                    </svg>
                    <h4 class="field__legend">Edad</h4>
                  </div>
                  <span class="field__content">${calcularEdadExacta(birthdate)} años</span>
                </div>
              </div>

              <div class="card__section">
                <div class="card__field">
                  <div class="field__title">
                    <svg
                      class="field__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path
                        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                      ></path>
                    </svg>
                    <h4 class="field__legend">Grado</h4>
                  </div>
                  <span class="field__content">${student.Curso.Grado}° Año</span>
                </div>
                <div class="card__field">
                  <div class="field__title">
                    <svg
                      class="field__icon"
                      fill="none"
                      stroke="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    >
                      <path
                        d="M23 24h-22v-2h1v-7h-2l3-9h5.429l2.571-2.203v-3.797h5l-1 1.491 1 1.509h-4l3.571 3h5.429l3 9h-2v7h1v2zm-12-5h-1v4h1v-4zm3 0h-1v4h1v-4zm6-4h-16v7h4v-5h8v5h4v-7zm-15 4h2v2h-2v-2zm14 0v2h-2v-2h2zm-14-3h2v2h-2v-2zm12 0h2v2h-2v-2zm.905-8l-1.297 1.513-4.608-3.949-4.608 3.949-1.297-1.513h-1.653l-1.667 5h18.45l-1.667-5h-1.653zm-5.905-.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5zm0 1.5h-.763v1.8h1.763v-.8h-1v-1z"
                      />
                    </svg>
                    <h4 class="field__legend">Sección</h4>
                  </div>
                  <span class="field__content">${student.Curso.Seccion}</span>
                </div>
              </div>
              <div class="card__section">
                <div class="card__field card__field--revision field__state">
                  <div class="field__title">
                    <svg
                      class="field__icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="8" r="7"></circle>
                      <polyline
                        points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"
                      ></polyline>
                    </svg>
                    <h4 class="field__legend">
                      Estado: <span id="state">${student.EstadoEstudiante.Estado}</span>
                    </h4>
                  </div>
                </div>
              </div>
            </section>
      `;

      cardContainer.appendChild(card);
    });
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "Error");
    notification.setAttribute("error", Error.message);
    notificationsContainer.appendChild(notification);
  }

  document.getElementById("logout").addEventListener("click", (event) => {
    event.preventDefault();
    const confirmation = confirm("¿Segur@ que quieres cerrar sesión?");

    if (confirmation) {
      localStorage.clear();
      window.location.href = "/app/iniciar-sesion.html";
    }
  });
});
