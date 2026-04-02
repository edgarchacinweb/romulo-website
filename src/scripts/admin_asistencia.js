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
    
    // Contenedores a ocultar según TAB
    const filterDocente = document.getElementById("filterDocente");
    const filterFecha = document.getElementById("filterFecha");

    // TABS DE NAVEGACIÓN
    let currentTab = 'diario';
    const tabDiario = document.getElementById("tabDiario");
    const tabLapsos = document.getElementById("tabLapsos");

    // Elementos del Reporte
    const reportCard = document.getElementById("reportCard");
    const reportTitle = document.getElementById("reportTitle");
    const reportSubtitle = document.getElementById("reportSubtitle");

    // Elementos del Dashboard Global
    const globalTotalVal = document.getElementById("globalTotal");
    const globalPresentVal = document.getElementById("globalPresent");
    const globalAbsentVal = document.getElementById("globalAbsent");

    // Elementos del Dashboard de Sección
    const sectionDashboard = document.getElementById("sectionDashboard");
    const sectionTotalVal = document.getElementById("sectionTotal");
    const sectionPresentVal = document.getElementById("sectionPresent");
    const sectionAbsentVal = document.getElementById("sectionAbsent");
    
    // Tablas
    const diarioTable = document.getElementById("diarioTable");
    const lapsoTable = document.getElementById("lapsoTable");
    const tableBody = document.getElementById("tableBody");
    const lapsoTableBody = document.getElementById("lapsoTableBody");
    
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
    let currentLapsoData = []; // Nueva variable para los lapsos
    let currentEditRecordId = null; 
    let allTeachers = []; // Todos los docentes registrados
    let allSubjects = []; // Todas las materias registradas
    let allSchedules = []; // El horario completo para cruzar datos

    // Por defecto colocamos la fecha de hoy
    fechaSelect.valueAsDate = new Date();

    // ==========================================
    // LÓGICA DE TABS (PESTAÑAS)
    // ==========================================
    tabDiario.addEventListener("click", () => {
        currentTab = 'diario';
        tabDiario.classList.add('active');
        tabLapsos.classList.remove('active');
        
        // Mostrar filtros específicos del diario
        filterDocente.style.display = 'block';
        filterFecha.style.display = 'block';
        reportCard.style.display = "none";
        btnBuscar.textContent = "Buscar Registro Diario";
    });

    tabLapsos.addEventListener("click", () => {
        currentTab = 'lapsos';
        tabLapsos.classList.add('active');
        tabDiario.classList.remove('active');
        
        // Ocultar filtros que no aplican para el consolidado de boletas
        filterDocente.style.display = 'none'; 
        filterFecha.style.display = 'none';
        reportCard.style.display = "none";
        btnBuscar.textContent = "Generar Consolidado por Lapsos";
    });

    /**
     * Función auxiliar para poblar el selector de materias
     */
    function populateSubjectsDropdown(list) {
        materiaSelect.innerHTML = '<option value="">Todas las materias</option>';
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

    // 0. CARGAR DASHBOARD GLOBAL AL INICIAR
    async function loadGlobalDashboard() {
        try {
            const res = await fetch(`${apiUrl}/assistance/admin/dashboard_hoy`, { 
                headers: { "Authorization": `Bearer ${token}` } 
            });
            if (res.ok) {
                const data = await res.json();
                if (globalTotalVal) globalTotalVal.textContent = data.total_evaluados;
                if (globalPresentVal) globalPresentVal.textContent = data.presentes;
                if (globalAbsentVal) globalAbsentVal.textContent = data.ausentes;
            }
        } catch (error) {
            console.error("Error cargando dashboard global:", error);
        }
    }

    loadGlobalDashboard();

    // 1. CARGAR SELECTS DE FILTROS AL INICIAR
    async function loadFilters() {
        try {
            const cursosRes = await fetch(`${apiUrl}/course/sections`, { headers: { "Authorization": `Bearer ${token}` } });
            if (cursosRes.ok) {
                const cursos = await cursosRes.json();
                cursoSelect.innerHTML = '<option value="">Seleccione un Curso</option>';
                
                cursos.forEach(c => {
                    const numSections = parseInt(c.Seccion) || 1;
                    
                    for (let i = 1; i <= numSections; i++) {
                        const opt = document.createElement("option");
                        opt.value = c.CursoId;
                        opt.dataset.section = i; 
                        
                        const gradoTexto = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to" }[c.Grado] || `${c.Grado}°`;
                        const seccionLetra = String.fromCharCode(64 + i);
                        opt.textContent = `${gradoTexto} Año - Sección ${seccionLetra}`;
                        cursoSelect.appendChild(opt);
                    }
                });
            }

            const termRes = await fetch(`${apiUrl}/school_term/list`, { headers: { "Authorization": `Bearer ${token}` } });
            if (termRes.ok) {
                const terms = await termRes.json();
                let activeTerm = terms.find(t => t.Activo === true || t.activo === true || t.Activo === 1 || String(t.Activo).toLowerCase() === "true");
                
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

            const docentesRes = await fetch(`${apiUrl}/teacher/list`, { headers: { "Authorization": `Bearer ${token}` } });
            if (docentesRes.ok) {
                allTeachers = await docentesRes.json();
                populateTeachersDropdown(allTeachers);
            }

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

        docenteSelect.value = "";
        materiaSelect.value = "";

        if (!selectedCursoId || !selectedSectionNum) {
            populateTeachersDropdown(allTeachers);
            populateSubjectsDropdown(allSubjects);
            return;
        }

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

        if (!cursoId) {
            alert("El Año y Sección son obligatorios para buscar el reporte.");
            return;
        }

        const originalText = btnBuscar.textContent;
        btnBuscar.textContent = "Buscando...";
        btnBuscar.disabled = true;

        try {
            // SI ESTAMOS EN LA PESTAÑA DEL REPORTE DIARIO
            if (currentTab === 'diario') {
                if (!fecha) {
                    alert("La Fecha es obligatoria para el reporte diario.");
                    btnBuscar.disabled = false;
                    btnBuscar.textContent = originalText;
                    return;
                }

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
                        if (sectionDashboard) sectionDashboard.style.display = "none";
                    } else {
                        // Actualizar Dashboard de Sección
                        const total = currentAttendanceData.length;
                        const present = currentAttendanceData.filter(a => a.Activo).length;
                        const absent = total - present;

                        if (sectionTotalVal) sectionTotalVal.textContent = total;
                        if (sectionPresentVal) sectionPresentVal.textContent = present;
                        if (sectionAbsentVal) sectionAbsentVal.textContent = absent;
                        if (sectionDashboard) sectionDashboard.style.display = "grid";

                        renderTableDiario(data);
                    }
                } else {
                    const errorData = await response.json();
                    alert(`Error al buscar asistencias: ${errorData.message}`);
                    reportCard.style.display = "none";
                }
            } 
            // SI ESTAMOS EN LA PESTAÑA DEL CONSOLIDADO POR LAPSOS
            else {
                const queryParams = new URLSearchParams({
                    cursoId: cursoId,
                    seccion: seccionNum,
                    ...(materiaId && { materiaId })
                });

                const response = await fetch(`${apiUrl}/assistance/admin/report_lapso?${queryParams.toString()}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    currentLapsoData = data.reporte_lapsos || [];
                    
                    if (currentLapsoData.length === 0) {
                        alert("No hay asistencias registradas en este curso durante el año escolar.");
                        reportCard.style.display = "none";
                        if (sectionDashboard) sectionDashboard.style.display = "none";
                    } else {
                        if (sectionDashboard) sectionDashboard.style.display = "none"; // No aplica tabla general en lapsos
                        renderTableLapsos(currentLapsoData);
                    }
                } else {
                    const errorData = await response.json();
                    alert(`Error al buscar asistencias por lapsos: ${errorData.message}`);
                    reportCard.style.display = "none";
                }
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión al consultar los reportes.");
        } finally {
            btnBuscar.textContent = originalText;
            btnBuscar.disabled = false;
        }
    });

    // 3. RENDERIZAR LA TABLA DEL REPORTE DIARIO
    function renderTableDiario(data) {
        reportCard.style.display = "block";
        diarioTable.style.display = "table"; 
        lapsoTable.style.display = "none";

        const cursoText = cursoSelect.options[cursoSelect.selectedIndex].text;
        const materiaText = materiaSelect.value ? materiaSelect.options[materiaSelect.selectedIndex].text : "Todas las materias";
        const docenteText = docenteSelect.value ? docenteSelect.options[docenteSelect.selectedIndex].text : "Varios";
        
        reportTitle.textContent = `Reporte Diario: ${materiaText} - ${cursoText}`;
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
                <td data-html2canvas-ignore="true">
                    <button class="btn-edit-small" onclick="window.openEditModal('${record.AsistenciaId}', '${record.NombreEstudiante}', ${record.Activo})">
                         Editar
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 3.1 RENDERIZAR LA TABLA DEL CONSOLIDADO POR LAPSOS
    function renderTableLapsos(data) {
        reportCard.style.display = "block";
        diarioTable.style.display = "none"; 
        lapsoTable.style.display = "table";

        const cursoText = cursoSelect.options[cursoSelect.selectedIndex].text;
        const materiaText = materiaSelect.value ? materiaSelect.options[materiaSelect.selectedIndex].text : "Todas las materias";
        
        reportTitle.textContent = `Consolidado por Lapsos: ${materiaText}`;
        reportSubtitle.textContent = `Curso: ${cursoText} | Año Escolar: 2025-2026`;

        lapsoTableBody.innerHTML = "";

        data.forEach(estudiante => {
            const materiasKeys = Object.keys(estudiante.Materias);
            if (materiasKeys.length === 0) return;

            // Recorremos cada materia del estudiante
            materiasKeys.forEach((nombreMateria, index) => {
                const tr = document.createElement("tr");
                const mData = estudiante.Materias[nombreMateria];
                const totalFaltas = mData["1"].I + mData["2"].I + mData["3"].I;

                // Solo ponemos el nombre del estudiante en la primera fila (rowspan)
                let tdEstudiante = '';
                if (index === 0) {
                    tdEstudiante = `<td rowspan="${materiasKeys.length}" style="font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; vertical-align: middle;">${estudiante.NombreEstudiante}</td>`;
                }

                tr.innerHTML = `
                    ${tdEstudiante}
                    <td style="color: #334155; font-weight: 500;">${nombreMateria}</td>
                    <td style="text-align: center;">
                        <span class="badge present" style="padding: 4px 8px;">${mData["1"].A}</span> / 
                        <span class="badge absent" style="padding: 4px 8px;">${mData["1"].I}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="badge present" style="padding: 4px 8px;">${mData["2"].A}</span> / 
                        <span class="badge absent" style="padding: 4px 8px;">${mData["2"].I}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="badge present" style="padding: 4px 8px;">${mData["3"].A}</span> / 
                        <span class="badge absent" style="padding: 4px 8px;">${mData["3"].I}</span>
                    </td>
                    <td style="text-align: center; font-weight: bold; color: ${totalFaltas >= 10 ? '#ffffff' : '#991b1b'}; background-color: ${totalFaltas >= 10 ? '#ef4444' : '#fef2f2'};">
                        ${totalFaltas}
                    </td>
                `;
                
                // Si tiene 10 o más faltas, resaltamos toda la fila
                if (totalFaltas >= 10) {
                    tr.style.backgroundColor = "#fee2e2";
                    tr.title = "⚠️ Alerta: Riesgo Académico por inasistencias";
                }

                lapsoTableBody.appendChild(tr);
            });
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
                btnBuscar.click(); // Recargar la tabla automáticamente
            } else {
                const errorData = await response.json();
                alert(`Error al actualizar: ${errorData.message}`);
                hideModal();
            }
        } catch (error) {
            console.error(error);
            alert("Error conectando con el servidor.");
        } finally {
            btnSaveEdit.textContent = "Guardar Modificación";
        }
    });

    // 5. EXPORTACIÓN A PDF CON JSPDF Y AUTOTABLE
    btnDownloadPdf.addEventListener("click", () => {
        const originalText = btnDownloadPdf.innerHTML;
        btnDownloadPdf.innerHTML = "Generando PDF...";

        try {
            // Inicializamos jsPDF en formato A4 horizontal ('landscape')
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- 1. AGREGAR LOGO AL PDF ---
            try {
                const logoImg = document.querySelector('.header-brand img');
                if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
                    doc.addImage(logoImg, 'PNG', 20, 12, 25, 25);
                }
            } catch (imgError) {
                console.warn("No se pudo agregar el logo al PDF", imgError);
            }

            // --- 2. AGREGAR MEMBRETE OFICIAL ---
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0); 
            doc.text("REPÚBLICA BOLIVARIANA DE VENEZUELA", pageWidth / 2, 16, { align: "center" });
            doc.text("MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN", pageWidth / 2, 21, { align: "center" });
            doc.text("LICEO N DON ROMULO GALLEGOS * S2990D0503", pageWidth / 2, 26, { align: "center" });
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("C/SAN MATEO, BARRIO ALAYON, P. ANDRES ELOY BLANCO MARACAY", pageWidth / 2, 31, { align: "center" });

            // Capturar textos de los selectores para los subtitulos
            const cursoText = cursoSelect.options[cursoSelect.selectedIndex].text;
            const materiaText = materiaSelect.value ? materiaSelect.options[materiaSelect.selectedIndex].text : "Todas las materias";
            const docenteText = docenteSelect.value ? docenteSelect.options[docenteSelect.selectedIndex].text : "Varios";
            const fechaText = fechaSelect.value;

            // LÓGICA PARA EXPORTAR EL PDF DEL REPORTE DIARIO
            if (currentTab === 'diario') {
                if (!currentAttendanceData || currentAttendanceData.length === 0) {
                    alert("No hay datos de reporte diario para exportar.");
                    btnDownloadPdf.innerHTML = originalText;
                    return;
                }

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42); 
                doc.text(`Reporte de Asistencia Diario: ${materiaText} - ${cursoText}`, pageWidth / 2, 45, { align: "center" });
                
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139); 
                doc.text(`Docente: ${docenteText} | Fecha: ${fechaText}`, pageWidth / 2, 52, { align: "center" });

                const tableColumn = ["ESTUDIANTE", "ESTADO", "MOTIVO (DOCENTE)", "NOTA ADMIN"];
                const tableRows = [];

                currentAttendanceData.forEach(record => {
                    const estado = record.Activo ? 'Presente' : 'Ausente';
                    const justificacion = record.JustificacionDocente || '-';
                    const notaAdmin = record.NotaAdmin || '-';
                    tableRows.push([record.NombreEstudiante, estado, justificacion, notaAdmin]);
                });

                doc.autoTable({
                    startY: 60,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 10, cellPadding: 4 },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                });

                doc.save(`Reporte_Diario_${fechaText}.pdf`);
            } 
            // LÓGICA PARA EXPORTAR EL PDF DEL CONSOLIDADO POR LAPSOS
            else {
                if (!currentLapsoData || currentLapsoData.length === 0) {
                    alert("No hay datos consolidados para exportar.");
                    btnDownloadPdf.innerHTML = originalText;
                    return;
                }

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42); 
                doc.text(`Consolidado por Lapsos: ${materiaText} - ${cursoText}`, pageWidth / 2, 45, { align: "center" });
                
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139); 
                doc.text(`Año Escolar: 2025-2026`, pageWidth / 2, 52, { align: "center" });

                const tableColumn = ["ESTUDIANTE", "MATERIA", "1ER MOMENTO", "2DO MOMENTO", "3ER MOMENTO", "TOTAL FALTAS"];
                const tableRows = [];

                currentLapsoData.forEach(estudiante => {
                    const materiasKeys = Object.keys(estudiante.Materias);
                    materiasKeys.forEach((nombreMateria, index) => {
                        const mData = estudiante.Materias[nombreMateria];
                        const totalFaltas = mData["1"].I + mData["2"].I + mData["3"].I;
                        
                        // Solo imprimimos el nombre del estudiante en su primera materia para no repetir
                        const nombreCelda = index === 0 ? estudiante.NombreEstudiante : '';
                        
                        const momento1 = `${mData["1"].A} Asist. - ${mData["1"].I} Faltas`;
                        const momento2 = `${mData["2"].A} Asist. - ${mData["2"].I} Faltas`;
                        const momento3 = `${mData["3"].A} Asist. - ${mData["3"].I} Faltas`;

                        tableRows.push([nombreCelda, nombreMateria, momento1, momento2, momento3, totalFaltas.toString()]);
                    });
                });

                doc.autoTable({
                    startY: 60,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
                    styles: { fontSize: 10, cellPadding: 4 },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                });

                doc.save(`Consolidado_Lapsos_${cursoText}.pdf`);
            }
            
        } catch (error) {
            console.error("Error generando PDF nativo:", error);
            alert("Ocurrió un error al generar el PDF.");
        } finally {
            btnDownloadPdf.innerHTML = originalText;
        }
    });
});