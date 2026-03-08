import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

document.addEventListener('DOMContentLoaded', async () => {
    let userdata = {};
    const loader = document.createElement("loader-spinner");
    const notifications = document.getElementById("notifications");
    loader.setAttribute("title", "Cargando datos...");

    try {
        document.appendChild(loader);
        // Cargando datos del usuario
        const userPromise = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
            "method": "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
    
        const userResponse = await userPromise.json();
        if (!userResponse.ok) throw new Error(userResponse.message);
        userdata = {...userResponse};
    } catch (Error) {
        console.error(Error.message);
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("message", Error.message);
        notifications.appendChild(notification);
    } finally {
        loader.remove();
    }
    

    // 1. Manejo del Formulario (Mostrar estado de éxito)
    const periodForm = document.getElementById('periodForm');
    const successMessage = document.getElementById('successMessage');

    if (periodForm) {
        periodForm.addEventListener('submit', (e) => {
            // Evitamos que el formulario recargue la página (comportamiento por defecto)
            e.preventDefault();
            
            // Validamos muy básicamente que hayan seleccionado fechas (simulado)
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;

            if (fechaInicio && fechaFin) {
                // Mostramos el mensaje con efecto de aparición
                successMessage.classList.remove('hidden');
                
                // Opcional: Ocultarlo después de unos segundos
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 4000);
            }
        });
    }

    // 2. Transición de Salida y Redirección
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Seleccionamos el body para aplicarle la animación de salida
            const body = document.body;
            
            // Cambiamos la clase de entrada por la de salida
            body.classList.remove('page-enter');
            body.classList.add('page-exit');
            
            // Esperamos que termine la animación en CSS (0.6s = 600ms)
            // antes de cambiar de página a la ruta que solicitaste.
            setTimeout(() => {
                window.location.href = '/app/admin/dashboard/';
            }, 600); // Sincronizado exacto con el tiempo de transition de CSS
        });
    }

    // 3. Interacciones decorativas extras
    // Prevenir que los botones de editar recarguen o salten la página en esta demo
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Aquí en un futuro puedes abrir un modal de edición usando un enfoque similar.
            console.log("Activando modo edición para este período...");
        });
    });
});