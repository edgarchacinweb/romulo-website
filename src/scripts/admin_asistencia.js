import authorize from "./auth.js";

// Solo Administradores pueden acceder a este panel
authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';
    
    // Selectores del Filtro
    const cursoSelect = document.getElementById("cursoSelect");
    const docenteSelect = document.getElementById("docenteSelect");
    const materiaSelect = document.getElementById("materiaSelect");
    const fechaSelect = document.getElementById("fechaSelect");
    const btnBuscar = document.getElementById("btnBuscar");
    
    // Elementos del Reporte
    const reportCard = document.getElementById("reportCard");
    const reportTitle = document.getElementById("reportTitle");
    const reportSubtitle = document.getElementById("reportSubtitle");
    const tableBody = document.getElementById("tableBody");
    const btnDownloadPdf = document.getElementById("btnDownloadPdf");
    
    // Elementos del Modal
    const editModal = document.getElementById("editModal");
    const closeModal = document.getElementById("closeModal");
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    const btnSaveEdit = document.getElementById("btnSaveEdit");
    const modalStudentName = document.getElementById("modalStudentName");
    const modalStatus = document.getElementById("modalStatus");
    const modalNote = document.getElementById("modalNote");
    
    let currentAttendanceData = []; // Guardará la data de la tabla
    let currentEditRecordId = null; // ID del registro que se está editando

    // Por defecto colocamos la fecha de hoy
    fechaSelect.valueAsDate = new Date();

    // 1. CARGAR SELECTS DE FILTROS AL INICIAR
    async function loadFilters() {
        try {
            // Cargar Cursos (Años y Secciones)
            const cursosRes = await fetch(`${apiUrl}/course/sections`, { headers: { "Authorization": `Bearer ${token}` } });
            if (cursosRes.ok) {
                const cursos = await cursosRes.json();
                cursos.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.CursoId;
                    
                    // Transformamos el grado ("1er", "2do", etc.) y la sección (1 -> "A", 2 -> "B", etc.)
                    const gradoTexto = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to" }[c.Grado] || `${c.Grado}°`;
                    const seccionLetra = String.fromCharCode(64 + parseInt(c.Seccion));
                    
                    opt.textContent = `${gradoTexto} Año - Sección ${seccionLetra}`;
                    cursoSelect.appendChild(opt);
                });
            }

            // Cargar Docentes
            const docentesRes = await fetch(`${apiUrl}/people/teachers`, { headers: { "Authorization": `Bearer ${token}` } });
            if (docentesRes.ok) {
                const docentes = await docentesRes.json();
                docentes.forEach(d => {
                    const opt = document.createElement("option");
                    opt.value = d.DocenteId || d.UsuarioId;
                    opt.textContent = `${d.Nombre} ${d.Apellido}`;
                    docenteSelect.appendChild(opt);
                });
            }

            // Cargar Materias
            const materiasRes = await fetch(`${apiUrl}/subject/get_all`, { headers: { "Authorization": `Bearer ${token}` } });
            if (materiasRes.ok) {
                const materias = await materiasRes.json();
                materias.forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = m.MateriaId;
                    opt.textContent = m.Nombre;
                    materiaSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.error("Error cargando filtros:", error);
        }
    }

    loadFilters();

    // 2. FUNCIÓN DE BÚSQUEDA DEL ADMINISTRADOR
    btnBuscar.addEventListener("click", async () => {
        const cursoId = cursoSelect.value;
        const docenteId = docenteSelect.value;
        const materiaId = materiaSelect.value;
        const fecha = fechaSelect.value;

        if (!cursoId || !fecha) {
            alert("El Año/Sección y la Fecha son obligatorios para buscar el reporte.");
            return;
        }

        btnBuscar.textContent = "Buscando...";
        btnBuscar.disabled = true;

        try {
            // NOTA: Esta ruta en el backend debe ser creada para que el ADMIN pueda consultar cualquier asistencia
            const queryParams = new URLSearchParams({
                cursoId: cursoId,
                fecha: fecha,
                ...(docenteId && { docenteId }),
                ...(materiaId && { materiaId })
            });

            const response = await fetch(`${apiUrl}/assistance/admin/report?${queryParams.toString()}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                currentAttendanceData = data.asistencias || [];
                
                if (currentAttendanceData.length === 0) {
                    alert("No hay asistencias cargadas para esta fecha y sección.");
                    reportCard.style.display = "none";
                } else {
                    renderTable(data);
                }
            } else {
                // Bloque Fallback (Mock Data): Para que puedas ver el diseño si el backend no tiene la ruta aún
                console.warn("Ruta backend no encontrada, mostrando datos de prueba visuales.");
                mockDataVisualTest(); 
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión al consultar los reportes.");
            mockDataVisualTest(); // Fallback temporal para diseño
        } finally {
            btnBuscar.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Buscar Asistencia`;
            btnBuscar.disabled = false;
        }
    });

    // 3. RENDERIZAR LA TABLA DE RESULTADOS
    function renderTable(data) {
        reportCard.style.display = "block";
        
        // Configurar Cabeceras
        const cursoText = cursoSelect.options[cursoSelect.selectedIndex].text;
        const materiaText = materiaSelect.value ? materiaSelect.options[materiaSelect.selectedIndex].text : "Todas las materias";
        const docenteText = docenteSelect.value ? docenteSelect.options[docenteSelect.selectedIndex].text : "Varios";
        
        reportTitle.textContent = `${materiaText} - ${cursoText}`;
        reportSubtitle.textContent = `Docente: ${docenteText} | Fecha: ${fechaSelect.value}`;

        tableBody.innerHTML = "";

        currentAttendanceData.forEach(record => {
            const tr = document.createElement("tr");
            
            // Estado visual
            let statusBadge = record.Activo 
                ? `<span class="badge present">Presente</span>` 
                : `<span class="badge absent">Ausente</span>`;
            
            // Si el Admin lo editó antes, mostrar un badge extra
            let adminBadge = record.EditadoPorAdmin ? `<br><span class="badge edited" style="margin-top:4px; display:inline-block;">Editado por Admin</span>` : "";

            tr.innerHTML = `
                <td style="font-weight: 500; color: #1e293b;">${record.NombreEstudiante}</td>
                <td>${statusBadge} ${adminBadge}</td>
                <td style="color: #64748b; font-style: italic;">${record.JustificacionDocente || '-'}</td>
                <td style="color: #0f172a; font-size: 0.9rem;">${record.NotaAdmin || '-'}</td>
                <td class="html2pdf__ignore">
                    <button class="btn-edit-small" onclick="window.openEditModal('${record.AsistenciaId}', '${record.NombreEstudiante}', ${record.Activo})">
                         Editar
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 4. LÓGICA DEL MODAL Y EDICIÓN
    window.openEditModal = (id, nombre, statusActual) => {
        currentEditRecordId = id;
        modalStudentName.textContent = nombre;
        modalStatus.value = statusActual ? "true" : "false";
        modalNote.value = ""; // Limpiar nota
        btnSaveEdit.disabled = true; // Bloquear botón hasta que escriba nota
        
        editModal.style.display = "flex";
    };

    const hideModal = () => { editModal.style.display = "none"; currentEditId = null; };
    closeModal.addEventListener("click", hideModal);
    btnCancelEdit.addEventListener("click", hideModal);

    // Validación estricta: La nota es OBLIGATORIA para que el Admin modifique
    modalNote.addEventListener("input", (e) => {
        if (e.target.value.trim().length >= 10) {
            btnSaveEdit.disabled = false;
        } else {
            btnSaveEdit.disabled = true;
        }
    });

    btnSaveEdit.addEventListener("click", async () => {
        const newStatus = modalStatus.value === "true";
        const adminNote = modalNote.value.trim();

        btnSaveEdit.textContent = "Guardando...";
        btnSaveEdit.disabled = true;

        try {
            // NOTA: Ruta sugerida para el backend -> PUT /assistance/admin/edit/<AsistenciaId>
            const response = await fetch(`${apiUrl}/assistance/admin/edit/${currentEditRecordId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    Activo: newStatus,
                    NotaAdmin: adminNote
                })
            });

            if (response.ok) {
                alert("Registro actualizado correctamente.");
                hideModal();
                btnBuscar.click(); // Recargar la tabla
            } else {
                // Simulación para prueba visual (Si la ruta no existe, aplicamos en memoria)
                const record = currentAttendanceData.find(r => r.AsistenciaId === currentEditRecordId);
                if(record) {
                    record.Activo = newStatus;
                    record.EditadoPorAdmin = true;
                    record.NotaAdmin = adminNote;
                }
                alert("Simulación: Actualizado en memoria (Ruta backend pendiente).");
                hideModal();
                renderTable({ asistencias: currentAttendanceData });
            }
        } catch (error) {
            console.error(error);
            alert("Error conectando con el servidor.");
        } finally {
            btnSaveEdit.textContent = "Guardar Cambios";
        }
    });

    // 5. EXPORTACIÓN A PDF
    btnDownloadPdf.addEventListener("click", () => {
        const element = document.getElementById('pdfContent');
        const opt = {
            margin:       [10, 10, 10, 10], // top, left, bottom, right
            filename:     `Reporte_Asistencia_${fechaSelect.value}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        // El html2pdf ignorará los elementos con la clase "html2pdf__ignore" (ej. los botones)
        html2pdf().set(opt).from(element).save();
    });

    // ==========================================
    // MOCK DATA: PARA PRUEBAS DE INTERFAZ
    // ==========================================
    function mockDataVisualTest() {
        const mockData = {
            asistencias: [
                { AsistenciaId: "A1", NombreEstudiante: "Pedro Pérez", Activo: true, JustificacionDocente: "", EditadoPorAdmin: false, NotaAdmin: "" },
                { AsistenciaId: "A2", NombreEstudiante: "María Gómez", Activo: false, JustificacionDocente: "Problemas de salud", EditadoPorAdmin: false, NotaAdmin: "" },
                { AsistenciaId: "A3", NombreEstudiante: "Carlos Sánchez", Activo: false, JustificacionDocente: "Sin justificar", EditadoPorAdmin: true, NotaAdmin: "El representante trajo justificativo médico el día siguiente." }
            ]
        };
        currentAttendanceData = mockData.asistencias;
        renderTable(mockData);
    }
});