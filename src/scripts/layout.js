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

function buildSidebarForRole(role) {
    const navList = document.querySelector('.nav-list');
    if (!navList) return;

    if (role.toLowerCase() === 'representante') {
        // Enlaces para representante
        navList.innerHTML = `
            <li><a href="/app/representante/inicio/index.html" class="nav-item">🏠 Inicio</a></li>
            <li><a href="/app/representante/inscripcion/index.html" class="nav-item">📝 Inscribir a Estudiante</a></li>
            <li><a href="/app/representante/boletas/index.html" class="nav-item">📊 Boletas</a></li>
            <li><a href="/app/representante/horarios/index.html" class="nav-item">📅 Horarios</a></li>
            <li><a href="/app/representante/editar-perfil/index.html" class="nav-item">⚙️ Editar Perfil</a></li>
        `;
    } else if (role.toLowerCase() === 'docente') {
        // Enlaces para Docente
        navList.innerHTML = `
            <li><a href="/app/docente/inicio/index.html" class="nav-item">🏠 Inicio</a></li>
            <li><a href="/app/docente/horarios/index.html" class="nav-item">📅 Visualizar Horario</a></li>
            <li><a href="/app/docente/calificaciones/index.html" class="nav-item">📝 Calificaciones</a></li>
            <li><a href="/app/docente/asistencia/index.html" class="nav-item">✅ Asistencias</a></li>
        `;
    } else {
        // Para Admin mantendremos los generados desde HTML
        // Solo aseguramos que el enlace de Inicio apunte al dashboard de Admin
        const inicioLink = navList.querySelector('a[href*="inicio"]');
        if (inicioLink) {
            inicioLink.href = "/app/admin/dashboard/index.html";
        }
    }
}

function initializeLayoutLogic() {
    /* DATOS DEL USUARIO */
    const roleStr = localStorage.getItem('role') || 'Usuario';
    const roleElement = document.getElementById('userRole');
    if (roleElement) roleElement.textContent = roleStr;

    const token = localStorage.getItem('auth');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userEmailElement) {
        let displayInfo = 'Cargando...';
        
        // Si es Representante, mostrar Nombre y Apellido
        if (roleStr.toLowerCase() === 'representante') {
            displayInfo = localStorage.getItem('nombre_representante');
            
            if(!displayInfo && token) {
                displayInfo = 'Cargando...'; // Texto temporal
                
                // Extraer de forma asíncrona porque el JWT no parece contener el nombre
                (async () => {
                   try {
                       const res = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
                           headers: { "Authorization": `Bearer ${token}` }
                       });
                       if (res.ok) {
                           const data = await res.json();
                           if (data && data.Nombre) {
                               const fullname = `${data.Nombre} ${data.Apellido}`;
                               localStorage.setItem('nombre_representante', fullname);
                               userEmailElement.textContent = fullname;
                           }
                       }
                   } catch(e) {}
                })();
            }
            if(!displayInfo) displayInfo = 'Representante';
        } else if (roleStr.toLowerCase() === 'docente') {
            displayInfo = localStorage.getItem('nombre_docente');
            
            if(!displayInfo && token) {
                displayInfo = 'Cargando...'; // Texto temporal
                
                // Extraer de forma asíncrona vía API
                (async () => {
                   try {
                       const res = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
                           headers: { "Authorization": `Bearer ${token}` }
                       });
                       if (res.ok) {
                           const data = await res.json();
                           if (data && data.Nombre) {
                               const fullname = `${data.Nombre} ${data.Apellido}`;
                               localStorage.setItem('nombre_docente', fullname);
                               userEmailElement.textContent = fullname;
                           }
                       }
                   } catch(e) {}
                })();
            }
            if(!displayInfo) displayInfo = 'Docente';
        } else {
            // Lógica original para Administrador (mostrar email)
            const savedEmail = localStorage.getItem('email');
            if (savedEmail) {
                displayInfo = savedEmail;
            } else if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    displayInfo = payload.email || payload.Email || payload.correo || payload.sub;
                    if (!displayInfo) {
                        for (const key in payload) {
                            if (typeof payload[key] === 'string' && payload[key].includes('@')) {
                                displayInfo = payload[key];
                                break;
                            }
                        }
                    }
                } catch (e) {}
            }
        }
        
        userEmailElement.textContent = displayInfo || 'Cierra sesión y entra de nuevo';
    }

    /* SIDEBAR ROLE LOGIC */
    buildSidebarForRole(roleStr);

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
