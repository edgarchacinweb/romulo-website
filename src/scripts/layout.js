document.addEventListener('DOMContentLoaded', async () => {
    
    async function loadComponent(componentPath, containerId) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) throw new Error(`Status HTTP: ${response.status}`);
            
            const html = await response.text();
            const container = document.getElementById(containerId);
            if(container) {
                container.innerHTML = html;
            }
        } catch (error) {
            console.error(`Error al cargar el componente ${componentPath}:`, error);
        }
    }

    // Cargar Navbar y Sidebar en paralelo
    await Promise.all([
        loadComponent('/src/components/layout/navbar.html', 'navbar-container'),
        loadComponent('/src/components/layout/sidebar.html', 'sidebar-container')
    ]);

    initializeLayoutLogic();
    highlightActiveLink();
    setTabName();
});

function setTabName() {
    const tabNameElement = document.getElementById('current-tab-name');
    if (tabNameElement) {
        // Obtenemos el title del documento para usarlo como subtítulo.
        // Ej: "Calificaciones - Liceo Rómulo Gallegos" -> "Gestión de Calificaciones"
        let title = document.title.split('-')[0].trim();
        if(title.length === 0) title = "Gestión";
        tabNameElement.textContent = `Gestión de ${title}`;
    }
}

function initializeLayoutLogic() {
    /* DATOS DEL USUARIO */
    const roleStr = localStorage.getItem('role') || 'Usuario';
    const roleElement = document.getElementById('userRole');
    if (roleElement) roleElement.textContent = roleStr;

    const token = localStorage.getItem('auth');
    const userEmailElement = document.getElementById('userEmail');
    
    // Obtener el correo guardado directamente al hacer login
    const savedEmail = localStorage.getItem('email');

    if (userEmailElement) {
        if (savedEmail) {
            userEmailElement.textContent = savedEmail;
        } else if (token) {
            // Fallback: Si no hay email guardado (sesión iniciada antes del parche), intenta extraerlo del JWT
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                let extractedEmail = payload.email || payload.Email || payload.correo || payload.sub;
                
                // Si aún no se encuentra, buscar alguna llave que contenga arroba
                if (!extractedEmail) {
                    for (const key in payload) {
                        if (typeof payload[key] === 'string' && payload[key].includes('@')) {
                            extractedEmail = payload[key];
                            break;
                        }
                    }
                }
                
                userEmailElement.textContent = extractedEmail || 'Cierra sesión y entra de nuevo';
            } catch (e) {
                userEmailElement.textContent = 'Cierra sesión y entra de nuevo';
            }
        } else {
            userEmailElement.textContent = '';
        }
    }

    /* LOGOUT */
    const logoutBtn = document.getElementById('logoutBtnLayout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
            }
        });
    }

    /* RESPONSIVIDAD (MENÚ MÓVIL) */
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-container');
    const overlay = document.getElementById('mobile-overlay');

    if (menuBtn && sidebar && overlay) {
        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        menuBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
        // Obtenemos el path del href, y chequeamos si coincide de alguna manera
        const hrefPath = new URL(link.href, window.location.origin).pathname;
        
        // Comparamos el inicio del path actual (útil si hay subrutas bajo 'dashboard' u otros directorios)
        // Eliminamos "index.html" para comparar las carpetas
        const cleanHref = hrefPath.replace('/index.html', '').replace('/admin_asistencia.html', '');
        const cleanCurrent = currentPath.replace('/index.html', '').replace('/admin_asistencia.html', '');

        if (cleanCurrent === cleanHref || cleanCurrent.startsWith(cleanHref + '/')) {
            link.classList.add('active');
        }
    });
}
