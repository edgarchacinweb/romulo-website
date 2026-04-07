import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("auth");
    const notificationsContainer = document.getElementById("notifications");
    
    // Obtener ID del período de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const periodoId = urlParams.get("id");

    if (!periodoId) {
        // Redirigir si no hay ID
        window.location.href = "index.html";
        return;
    }

    const titleElement = document.getElementById("period-title");
    const kpiEstudiantes = document.getElementById("kpi-estudiantes");
    const kpiDocentes = document.getElementById("kpi-docentes");
    const kpiSecciones = document.getElementById("kpi-secciones");
    const kpiEstado = document.getElementById("kpi-estado");

    const loader = document.createElement("loader-spinner");
    loader.setAttribute("title", "Cargando estadísticas...");
    document.body.appendChild(loader);

    try {
        const response = await fetch(`${window.APP_CONFIG.api_url}/school_term/${periodoId}/estadisticas`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const result = await response.json();
            throw result.message || "Error al cargar las estadísticas del período";
        }

        const data = await response.json();

        // Actualizar UI
        titleElement.textContent = `Estadísticas del Período ${data.NombrePeriodo}`;
        
        // Animación simple de contadores
        animateValue(kpiEstudiantes, 0, data.TotalEstudiantes, 1000);
        animateValue(kpiDocentes, 0, data.TotalDocentes, 1000);
        animateValue(kpiSecciones, 0, data.TotalClases, 1000);

        // Badge de Estado
        const isActivo = data.Estado === "Activo";
        kpiEstado.innerHTML = `<span class="badge-estado ${isActivo ? 'badge-activo' : 'badge-finalizado'}">${data.Estado}</span>`;

    } catch (error) {
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("text", error);
        notificationsContainer.appendChild(notification);
        titleElement.textContent = "Error al cargar datos";
    } finally {
        loader.remove();
    }
});

// Helper para animar números
function animateValue(obj, start, end, duration) {
    if (end === 0) {
        obj.innerHTML = "0";
        return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
