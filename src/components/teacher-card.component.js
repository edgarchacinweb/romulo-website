class TeacherCardComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttribute() {
    return ["teacherData"];
  }

  connectedCallback() {
    const teacherData = JSON.parse(this.getAttribute("teacherData"));
    const { DatosPersona, Materias, FechaCreacion } = teacherData;

    this.shadowRoot.innerHTML = `
      <style>
        .teacher-card {
          border: 1px solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          padding: 1rem; /* 16px */
          background-color: var(--color-gray-50);
          box-shadow: var(--shadow);
          overflow: hidden;
          height: 60px;
          transition: all 350ms ease;
        }

        .teacher-card--active {
          height: 220px;
        }

        .teacher-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        .teacher-card-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem; /* 16px */
        }

        .teacher-card .checkbox {
          flex-shrink: 0;
          margin-top: 0.25rem; /* 4px */
        }

        .teacher-card-details {
          flex-grow: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem; /* 8px */
          margin-bottom: 0.5rem; /* 8px */
        }

        .header-container {
          display: flex;
          align-items: center;
        }

        .card-header-name {
          display: flex;
          align-items: center;
          gap: 0.5rem; /* 8px */
        }
        .card-header-name h3 {
          font-size: 1.125rem; /* 18px */
          font-weight: 500;
          color: var(--color-gray-900);
        }

        .card-dropdown-icon {
          color: var(--color-blue-600);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: var(--border-radius-full);
          transition: all 150ms ease;
        }

        .card-dropdown-icon svg {
          pointer-events: none;
        }

        .card-dropdown-icon--active {
          transform: rotate(180deg);
        }

        .card-dropdown-icon:hover {
          background-color: var(--color-blue-100);
        }

        .card-registration-date {
          font-size: 0.75rem; /* 12px */
          color: var(--color-gray-500);
          font-weight: 500;
        }

        .card-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem 1.5rem; /* 4px 24px */
          font-size: 0.875rem; /* 14px */
          color: var(--color-gray-600);
        }

        .header-container {
          display: flex;
          flex-direction: row;
          gap: 10px;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .card-details-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .card-details-grid .span-2 {
            grid-column: span 2 / span 2;
          }
        }

        .card-details-grid p {
          overflow-wrap: break-word;
        }
        .card-details-grid p span {
          font-weight: 500;
          color: var(--color-gray-800);
        }

        #teacher-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #acacac;
          box-shadow: 0 0 3px 1px #33333385;
          background-color: #ff0000;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
        }

        #teacher-delete-btn span {
          width: 18px;
          height: 18px;
          color: #fcfcfc;
        }
      </style>
      <div class="teacher-card" data-id="${teacherData.DatosPersona.Cedula}">
        <div class="teacher-card-content">
          <div class="teacher-card-details">
            <!-- Cabecera de la tarjeta -->
            <div class="card-header">
              <div class="header-container">
                <button type="button" id="teacher-delete-btn">
                  <span>B</span>
                </button>
                <div class="card-header-name">
                  <h3>
                    ${teacherData.DatosPersona.Nombre}
                    ${teacherData.DatosPersona.Apellido}
                  </h3>
                  <!-- Icono Dropdown -->
                  <span class="card-dropdown-icon">
                    <svg
                      class="icon"
                      style="width: 16px; height: 16px"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
              </div>
              <span class="card-registration-date"
                >Registrado: ${FechaCreacion}</span
              >
            </div>

            <!-- Detalles del docente -->
            <div class="card-details-grid">
              <p><span>Cédula:</span> V-${DatosPersona.Cedula}</p>
              <p><span>Teléfono:</span> +58 ${DatosPersona.Telefono}</p>
              <p><span>Dirección:</span> ${DatosPersona.Direccion}</p>
              <p><span>Materias:</span> ${Materias.join(", ")}</p>
              <p><span>Ocupación:</span> ${DatosPersona.Ocupacion}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Script
    const card = this.shadowRoot.querySelector(".teacher-card");
    this.shadowRoot
      .querySelector(".card-dropdown-icon")
      .addEventListener("click", (e) => {
        e.target.classList.toggle("card-dropdown-icon--active");
        card.classList.toggle("teacher-card--active");
      });
  }
}

customElements.define("teacher-card", TeacherCardComponent);
