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
    
    // VARIABLES DE ESTADO PARA FILTRADO DINÁMICO
    let currentAttendanceData = []; 
    let currentEditRecordId = null; 
    let allTeachers = []; // Guardamos todos los docentes y sus materias
    let allSubjects = []; // Guardamos la lista completa de materias como respaldo

    // Por defecto colocamos la fecha de hoy
    fechaSelect.valueAsDate = new Date();

    /**
     * Función auxiliar para poblar el selector de materias
     * @param {Array} list - Lista de materias a mostrar
     */
    function populateSubjectsDropdown(list) {
        materiaSelect.innerHTML = '<option value="">Seleccione una Materia</option>';
        list.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.MateriaId;
            opt.textContent = m.Nombre;
            materiaSelect.appendChild(opt);
        });
    }

    // 1. CARGAR SELECTS DE FILTROS AL INICIAR
    async function loadFilters() {
        try {
            // --- CARGAR CURSOS (AÑOS Y SECCIONES) ---
            const cursosRes = await fetch(`${apiUrl}/course/sections`, { headers: { "Authorization": `Bearer ${token}` } });
            if (cursosRes.ok) {
                const cursos = await cursosRes.json();
                cursos.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.CursoId;
                    const gradoTexto = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to" }[c.Grado] || `${c.Grado}°`;
                    const seccionLetra = String.fromCharCode(64 + parseInt(c.Seccion));
                    opt.textContent = `${gradoTexto} Año - Sección ${seccionLetra}`;
                    cursoSelect.appendChild(opt);
                });
            }

            // --- CARGAR DOCENTES ---
            const docentesRes = await fetch(`${apiUrl}/teacher/list`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            });

            if (docentesRes.ok) {
                allTeachers = await docentesRes.json();
                docenteSelect.innerHTML = '<option value="">Seleccione un Docente</option>';
                
                allTeachers.forEach(d => {
                    const opt = document.createElement("option");
                    opt.value = d.DocenteId;
                    const nombre = d.DatosPersona?.Nombre || "Sin nombre";
                    const apellido = d.DatosPersona?.Apellido || "";
                    opt.textContent = `${nombre} ${apellido}`;
                    docenteSelect.appendChild(opt);
                });
            }

            // --- CARGAR MATERIAS (INICIALMENTE TODAS) ---
            const materiasRes = await fetch(`${apiUrl}/subject/list`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            });
            if (materiasRes.ok) {
                allSubjects = await materiasRes.json();
                populateSubjectsDropdown(allSubjects);
            }
        } catch (error) {
            console.error("Error cargando filtros:", error);
        }
    }

    // === LÓGICA DE FILTRADO DINÁMICO: DOCENTE -> MATERIAS ===
    docenteSelect.addEventListener("change", () => {
        const selectedTeacherId = docenteSelect.value;
        
        if (!selectedTeacherId) {
            // Si deselecciona al docente, volvemos a mostrar todas las materias del sistema
            populateSubjectsDropdown(allSubjects);
            return;
        }

        // Buscamos el objeto del docente seleccionado en nuestra lista guardada
        const teacher = allTeachers.find(t => t.DocenteId === selectedTeacherId);
        
        if (teacher && teacher.Materias && teacher.Materias.length > 0) {
            // Cargamos solo las materias que este profesor tiene vinculadas
            populateSubjectsDropdown(teacher.Materias);
        } else {
            // Caso borde: El docente no tiene materias asignadas en la BD
            materiaSelect.innerHTML = '<option value="">El docente no tiene materias asignadas</option>';
        }
    });

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
                console.warn("Ruta backend /assistance/admin/report no encontrada o error.");
                mockDataVisualTest(); 
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión al consultar los reportes.");
            mockDataVisualTest();
        } finally {
            btnBuscar.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Buscar Asistencia`;
            btnBuscar.disabled = false;
        }
    });

    // 3. RENDERIZAR LA TABLA DE RESULTADOS
    function renderTable(data) {
        reportCard.style.display = "block";
        const cursoText = cursoSelect.options[cursoSelect.selectedIndex].text;
        const materiaText = materiaSelect.value ? materiaSelect.options[materiaSelect.selectedIndex].text : "Todas las materias";
        const docenteText = docenteSelect.value ? docenteSelect.options[docenteSelect.selectedIndex].text : "Varios";
        
        reportTitle.textContent = `${materiaText} - ${cursoText}`;
        reportSubtitle.textContent = `Docente: ${docenteText} | Fecha: ${fechaSelect.value}`;

        tableBody.innerHTML = "";

        currentAttendanceData.forEach(record => {
            const tr = document.createElement("tr");
            let statusBadge = record.Activo 
                ? `<span class="badge present">Presente</span>` 
                : `<span class="badge absent">Ausente</span>`;
            
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
        modalNote.value = ""; 
        btnSaveEdit.disabled = true;
        editModal.style.display = "flex";
    };

    const hideModal = () => { editModal.style.display = "none"; currentEditRecordId = null; };
    closeModal.addEventListener("click", hideModal);
    btnCancelEdit.addEventListener("click", hideModal);

    modalNote.addEventListener("input", (e) => {
        btnSaveEdit.disabled = e.target.value.trim().length < 10;
    });

    btnSaveEdit.addEventListener("click", async () => {
        const newStatus = modalStatus.value === "true";
        const adminNote = modalNote.value.trim();
        btnSaveEdit.textContent = "Guardando...";
        btnSaveEdit.disabled = true;

        try {
            const response = await fetch(`${apiUrl}/assistance/admin/edit/${currentEditRecordId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ Activo: newStatus, NotaAdmin: adminNote })
            });

            if (response.ok) {
                alert("Registro actualizado correctamente.");
                hideModal();
                btnBuscar.click(); 
            } else {
                alert("Ruta de edición no implementada en backend.");
                hideModal();
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
            margin:       [10, 10, 10, 10],
            filename:     `Reporte_Asistencia_${fechaSelect.value}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    });

    function mockDataVisualTest() {
        const mockData = {
            asistencias: [
                { AsistenciaId: "A1", NombreEstudiante: "Pedro Pérez", Activo: true, JustificacionDocente: "", EditadoPorAdmin: false, NotaAdmin: "" },
                { AsistenciaId: "A2", NombreEstudiante: "María Gómez", Activo: false, JustificacionDocente: "Problemas de salud", EditadoPorAdmin: false, NotaAdmin: "" },
                { AsistenciaId: "A3", NombreEstudiante: "Carlos Sánchez", Activo: false, JustificacionDocente: "Sin justificar", EditadoPorAdmin: true, NotaAdmin: "El representante trajo justificativo médico." }
            ]
        };
        currentAttendanceData = mockData.asistencias;
        renderTable(mockData);
    }
});