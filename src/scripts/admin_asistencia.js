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
    let allTeachers = []; // Todos los docentes registrados
    let allSubjects = []; // Todas las materias registradas
    let allSchedules = []; // El horario completo para cruzar datos

    // Por defecto colocamos la fecha de hoy
    fechaSelect.valueAsDate = new Date();

    /**
     * Función auxiliar para poblar el selector de materias
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

    /**
     * Función auxiliar para poblar el selector de docentes
     */
    function populateTeachersDropdown(list) {
        docenteSelect.innerHTML = '<option value="">Seleccione un Docente</option>';
        list.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.DocenteId;
            const nombre = d.DatosPersona?.Nombre || "Sin nombre";
            const apellido = d.DatosPersona?.Apellido || "";
            opt.textContent = `${nombre} ${apellido}`;
            docenteSelect.appendChild(opt);
        });
    }

    // 1. CARGAR SELECTS DE FILTROS AL INICIAR
    async function loadFilters() {
        try {
            // --- CARGAR CURSOS (AÑOS Y SECCIONES) ---
            const cursosRes = await fetch(`${apiUrl}/course/sections`, { headers: { "Authorization": `Bearer ${token}` } });
            if (cursosRes.ok) {
                const cursos = await cursosRes.json();
                cursoSelect.innerHTML = '<option value="">Seleccione un Curso</option>';
                
                // CORRECCIÓN: El backend devuelve la cantidad máxima de secciones.
                // Debemos iterar para generar la sección A, B, C... según corresponda.
                cursos.forEach(c => {
                    const numSections = parseInt(c.Seccion) || 1;
                    
                    for (let i = 1; i <= numSections; i++) {
                        const opt = document.createElement("option");
                        opt.value = c.CursoId;
                        // Guardamos la sección REAL (1, 2, 3...) en el dataset
                        opt.dataset.section = i; 
                        
                        const gradoTexto = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to" }[c.Grado] || `${c.Grado}°`;
                        const seccionLetra = String.fromCharCode(64 + i); // 1->A, 2->B
                        opt.textContent = `${gradoTexto} Año - Sección ${seccionLetra}`;
                        cursoSelect.appendChild(opt);
                    }
                });
            }

            // --- CARGAR PERIODO ACTIVO Y HORARIOS PARA VINCULACIÓN ---
            const termRes = await fetch(`${apiUrl}/school_term/list`, { headers: { "Authorization": `Bearer ${token}` } });
            if (termRes.ok) {
                const terms = await termRes.json();
                
                // CORRECCIÓN: Búsqueda robusta del periodo activo. Evita que falle si el backend envía 1 o "true"
                let activeTerm = terms.find(t => t.Activo === true || t.activo === true || t.Activo === 1 || String(t.Activo).toLowerCase() === "true");
                
                // Fallback de seguridad: si no encuentra uno activo, toma el primero (igual que en schedulemanager.js)
                if (!activeTerm && terms.length > 0) {
                    activeTerm = terms[0];
                }
                
                if (activeTerm) {
                    const scheduleRes = await fetch(`${apiUrl}/schedule/list/${activeTerm.PeriodoEscolarId}`, { 
                        headers: { "Authorization": `Bearer ${token}` } 
                    });
                    if (scheduleRes.ok) {
                        const scheduleData = await scheduleRes.json();
                        allSchedules = Array.isArray(scheduleData) ? scheduleData : (scheduleData.horario || []);
                    }
                }
            }

            // --- CARGAR DOCENTES ---
            const docentesRes = await fetch(`${apiUrl}/teacher/list`, { headers: { "Authorization": `Bearer ${token}` } });
            if (docentesRes.ok) {
                allTeachers = await docentesRes.json();
                populateTeachersDropdown(allTeachers);
            }

            // --- CARGAR MATERIAS ---
            const materiasRes = await fetch(`${apiUrl}/subject/list`, { headers: { "Authorization": `Bearer ${token}` } });
            if (materiasRes.ok) {
                allSubjects = await materiasRes.json();
                populateSubjectsDropdown(allSubjects);
            }
        } catch (error) {
            console.error("Error cargando filtros iniciales:", error);
        }
    }

    // === LÓGICA DE FILTRADO DINÁMICO 1: CURSO -> DOCENTES ===
    cursoSelect.addEventListener("change", () => {
        const selectedCursoId = cursoSelect.value;
        const selectedOption = cursoSelect.options[cursoSelect.selectedIndex];
        const selectedSectionNum = selectedOption ? selectedOption.dataset.section : null;

        // Resetear selectores dependientes
        docenteSelect.value = "";
        materiaSelect.value = "";

        if (!selectedCursoId || !selectedSectionNum) {
            // Si limpia el curso, mostramos todos los docentes de nuevo
            populateTeachersDropdown(allTeachers);
            populateSubjectsDropdown(allSubjects);
            return;
        }

        // Buscamos en el horario qué docentes imparten clases en ese curso y sección
        // Nota: usamos == para permitir igualdad entre string ("1") y número (1)
        const teacherIdsInCourse = [...new Set(
            allSchedules
                .filter(s => s.CursoId == selectedCursoId && s.Seccion == selectedSectionNum)
                .map(s => s.DocenteId)
        )];

        if (teacherIdsInCourse.length > 0) {
            const filteredTeachers = allTeachers.filter(t => teacherIdsInCourse.includes(t.DocenteId));
            populateTeachersDropdown(filteredTeachers);
        } else {
            docenteSelect.innerHTML = '<option value="">No hay docentes asignados a este curso</option>';
        }
        
        // Al cambiar el curso, también reseteamos las materias a todas hasta que elija un docente
        populateSubjectsDropdown(allSubjects);
    });

    // === LÓGICA DE FILTRADO DINÁMICO 2: DOCENTE -> MATERIAS ===
    docenteSelect.addEventListener("change", () => {
        const selectedTeacherId = docenteSelect.value;
        const selectedCursoId = cursoSelect.value;
        const selectedOption = cursoSelect.options[cursoSelect.selectedIndex];
        const selectedSectionNum = selectedOption ? selectedOption.dataset.section : null;
        
        if (!selectedTeacherId) {
            populateSubjectsDropdown(allSubjects);
            return;
        }

        const teacher = allTeachers.find(t => t.DocenteId === selectedTeacherId);
        
        if (teacher) {
            let filteredSubjects = teacher.Materias || [];

            // Refinamiento: Si hay un curso seleccionado, filtrar solo las materias que el docente da EN ESE curso
            if (selectedCursoId && selectedSectionNum) {
                const subjectIdsInSchedule = allSchedules
                    .filter(s => s.CursoId == selectedCursoId && s.Seccion == selectedSectionNum && s.DocenteId == selectedTeacherId)
                    .map(s => s.MateriaId);
                
                if (subjectIdsInSchedule.length > 0) {
                    filteredSubjects = (teacher.Materias || []).filter(m => subjectIdsInSchedule.includes(m.MateriaId));
                }
            }

            populateSubjectsDropdown(filteredSubjects);
        } else {
            materiaSelect.innerHTML = '<option value="">El docente no tiene materias asignadas</option>';
        }
    });

    loadFilters();

    // 2. FUNCIÓN DE BÚSQUEDA DEL ADMINISTRADOR
    btnBuscar.addEventListener("click", async () => {
        const cursoId = cursoSelect.value;
        const selectedOption = cursoSelect.options[cursoSelect.selectedIndex];
        const seccionNum = selectedOption ? selectedOption.dataset.section : null;
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
                seccion: seccionNum,
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
                const errorData = await response.json();
                alert(`Error al buscar asistencias: ${errorData.message}`);
                reportCard.style.display = "none";
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión al consultar los reportes.");
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
            
            let adminBadge = record.EditadoPorAdmin ? `<br><span class="badge edited" style="margin-top:4px; display:inline-block; font-size: 0.75rem; background:#fef3c7; color:#92400e; padding: 2px 6px; border-radius:4px;">Editado por Admin</span>` : "";

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
                btnBuscar.click(); // Recargar la tabla
            } else {
                const errorData = await response.json();
                alert(`Error al actualizar: ${errorData.message}`);
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
});