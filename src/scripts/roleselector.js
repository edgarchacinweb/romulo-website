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

        const users = [...data];

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
    } catch (error) {
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