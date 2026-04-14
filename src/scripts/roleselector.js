// Redireccionando si ya se inició sesión
const role = localStorage.getItem("role") ?? "";
const email = localStorage.getItem("user-email");

if (role === "administrador") window.location.href = "/app/admin/dashboard/";
else if (role === "docente") window.location.href = "/app/docente/inicio/";
else if (role === "representante") window.location.href = "/app/representante/inicio/";
else if (localStorage.length === 0 || !email) window.location.href = "/app/iniciar-sesion";

document.addEventListener('DOMContentLoaded', async () => {
    const btnLogout = document.getElementById('btn-logout');
    const modal = document.getElementById('logout-modal');
    const loader = document.createElement('loader-spinner');
    const notificationContainer = document.getElementById("notifications");
    loader.setAttribute("title", "Cargando Datos del Usuario...");

    // Cargando datos del usuario
    document.body.appendChild(loader);
    try {
        const response = await fetch(`${window.APP_CONFIG.api_url}/user/token/${email}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        const users = Array.isArray(data) ? [...data] : [data];

        // Guardando en localstorage al usuario por defecto, en caso de no tener otro usuario
        localStorage.setItem("users", JSON.stringify(users));
        if (users.length === 1) {
            localStorage.setItem("user-selected", 0);
            localStorage.setItem("auth", users[0].token);
            const role = users[0].role;

            if (role === "administrador") window.location.href = "/app/admin/dashboard/";
            else if (role === "docente") window.location.href = "/app/docente/inicio/";
            else if (role === "representante") window.location.href = "/app/representante/inicio/";
            return;
        }

        // Cargando datos personales del usuario
        const personResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${users[0].token}`
            }
        });

        const personData = await personResponse.json();

        if (!personResponse.ok) {
            throw new Error(personData.message);
        }

        const cardContainer = document.querySelector(".cards-container");
        users.forEach(user => {
            const card = document.createElement("role-card");
            card.setAttribute("role-type", user.role);
            card.setAttribute("name", `${personData.Nombre} ${personData.Apellido}`);
            card.setAttribute("cedula", `${!personData.Cedula.startsWith("E-") ? "V-" : "E-"}${personData.Cedula}`);
            card.setAttribute("phone", personData.Telefono);
            card.setAttribute("email", user.email);
            card.innerHTML = `
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>`
            if (user.role === "representante") card.setAttribute("students", 2);
            else if (user.role === "docente") {
                card.setAttribute("years", JSON.stringify(["1er Año", "2do Año", "3er Año"]));
                card.setAttribute("subjects", JSON.stringify(["Matemática", "Física", "Geometría"]));
            }
            cardContainer.appendChild(card);
        });
    } catch (error) {
        console.error(error.stack);
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("text", error.message);
        notificationContainer.appendChild(notification);
    } finally {
        loader.remove();
    }

    // Abrir Modal
    btnLogout.addEventListener('click', () => {
        modal.open();
    });

    // Escuchar el evento personalizado de confirmación desde el Web Component
    modal.addEventListener('confirm-logout', () => {
        modal.close();

        // Agregar la clase de animación de salida al body
        document.body.classList.remove('page-enter');
        document.body.classList.add('page-exit');
        localStorage.clear();

        // Esperar a que termine la animación para redirigir
        setTimeout(() => {
            window.location.href = '/app/iniciar-sesion';
        }, 500); // 500ms coincide con la duración de la animación css
    });
});