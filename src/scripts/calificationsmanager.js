import authorize from "../scripts/auth.js";
import numberToLetter from "./utils.js";
authorize("administrador");

const token = localStorage.getItem("auth");

document.addEventListener('DOMContentLoaded', async () => {
    // === Variables y Estado ===
    let courses = [];
    const logoutBtn = document.getElementById('logoutBtn');
    const gradeSelect = document.getElementById('gradeSelect');
    const sectionSelect = document.getElementById('sectionSelect');
    const loadStudentsBtn = document.getElementById('loadStudentsBtn');
    const studentsListSection = document.getElementById('studentsListSection');
    const initialWelcome = document.getElementById('initialWelcome');
    const body = document.body;

    // Elementos del Modal
    const gradesModal = document.getElementById('gradesModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelGradesBtn = document.getElementById('cancelGradesBtn');
    const saveGradesBtn = document.getElementById('saveGradesBtn');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalBackStudentName = document.getElementById('modalBackStudentName');
    const modalBackLink = document.getElementById('modalBackLink');
    const gradesForm = document.getElementById('gradesForm');

    // Elementos del Toast
    const toastNotification = document.getElementById('toastNotification');
    const toastStudentName = document.getElementById('toastStudentName');

    const studentData = {
        ci_27987654: { id: 'ci_27987654', name: 'Luis Morales', avatar: 'LM', saved: false, grades: {} },
        ci_30456789: { id: 'ci_30456789', name: 'Sofia Torres', avatar: 'ST', saved: false, grades: {} },
        ci_12345678: { id: 'ci_12345678', name: 'No Students', saved: false, grades: {} } // Para vista de 'No estudiantes'
    };

    let currentStudentId = null;
    let currentStudentSubjects = [];
    let currentLapsosMapping = {};

    let lapsosStatus = {
        lapso1_abierto: false,
        lapso2_abierto: false,
        lapso3_abierto: false
    };

    // Obtener los IDs de los lapsos actuales a nivel global
    try {
        const [lapsosResponse, statusResponse] = await Promise.all([
            fetch(`${window.APP_CONFIG.api_url}/lapsos/current`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${window.APP_CONFIG.api_url}/lapsos/status_carga`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        if(lapsosResponse.ok) {
            const dataLapsos = await lapsosResponse.json();
            dataLapsos.lapsos.forEach(l => { currentLapsosMapping[`lapso${l.lapso}`] = l.lapso_id; });
        }
        if(statusResponse.ok) {
            lapsosStatus = await statusResponse.json();
        }
    } catch(err) {
        console.error("Error cargando lapsos", err);
    }

    // Elementos del modal de Justificación
    const justificationModal = document.getElementById('justificationModal');
    const justificationText = document.getElementById('justificationText');
    const confirmJustificationBtn = document.getElementById('confirmJustificationBtn');
    const cancelJustificationBtn = document.getElementById('cancelJustificationBtn');

    // Elementos del modal de Edición Única
    const singleEditModal = document.getElementById('singleEditModal');
    const closeSingleEditBtn = document.getElementById('closeSingleEditBtn');
    const singleEditCurrentGrade = document.getElementById('singleEditCurrentGrade');
    const singleEditNewGrade = document.getElementById('singleEditNewGrade');
    const singleEditJustification = document.getElementById('singleEditJustification');
    const confirmSingleEditBtn = document.getElementById('confirmSingleEditBtn');
    
    let currentSingleEditData = null;

    // === Funciones Auxiliares ===

    // Validación de nota: rango 0-20 y tipo numérico
    const validateGrade = (grade) => {
        const numGrade = parseFloat(grade);
        // Verificación robusta: es número, está en rango, no es NaN (incluso si se cambió el input a texto maliciosamente)
        if (isNaN(numGrade) || numGrade < 0 || numGrade > 20 || String(grade).trim() === "") {
            return false;
        }
        return true;
    };

    const calculateAverage = (grades) => {
        if (!grades || grades.length === 0) return 0;
        const sum = grades.reduce((a, b) => a + b, 0);
        return (sum / grades.length).toFixed(2);
    };

    const isInputModifiedManually = (input) => {
        // Heurística simple para verificar si el tipo de input fue cambiado a texto maliciosamente
        return input.type !== 'number';
    }

    // === Lógica Principal ===

    // Manejo de Cierre de Sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            body.classList.remove('fade-in');
            body.classList.add('fade-out');
            setTimeout(() => {
                // Redirigir a la URL especificada después de la animación
                window.location.href = '/app/admin/dashboard/';
            }, 500); // coincide con la duración de la animación en CSS
        });
    }

    // Cargando la lista de grados escolares y secciones
    const loader = document.createElement("loader-spinner");
    try {
        document.body.appendChild(loader);
        const response = await fetch(`${window.APP_CONFIG.api_url}/course/sections`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            courses = [...data];
            gradeSelect.innerHTML = '<option value="" disabled selected>Seleccionar grado</option>';
            const gradosVistos = new Set();
            data.forEach(course => {
                if (!gradosVistos.has(course.Grado)) {
                    gradosVistos.add(course.Grado);
                    const option = document.createElement('option');
                    option.value = course.CursoId;
                    option.textContent = `${course.Grado}° Año`;
                    gradeSelect.appendChild(option);
                }
            })
        }
    } catch (error) {
        console.error('Error al cargar los grados:', error);
        alert(error.message);
    } finally {
        loader.remove();
    }

    // Lógica de Cargar Estudiantes
    loadStudentsBtn.addEventListener('click', async () => {
        const gradeStr = gradeSelect.options[gradeSelect.selectedIndex]?.text;
        const sectionStr = sectionSelect.options[sectionSelect.selectedIndex]?.text;
        const courseId = gradeSelect.value;
        const sectionIdx = sectionSelect.value;

        if (!courseId || sectionIdx === "") {
            initialWelcome.style.display = 'block';
            alert('Por favor selecciona grado y sección');
            return;
        }

        initialWelcome.style.display = 'none';
        const loaderIcon = document.createElement("loader-spinner");
        studentsListSection.innerHTML = '';
        studentsListSection.appendChild(loaderIcon);

        try {
            const sectionNumber = parseInt(sectionIdx) + 1; // 1-indexed for backend

            const response = await fetch(`${window.APP_CONFIG.api_url}/students/filter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Estado: "inscrito",
                    CursoId: courseId,
                    Seccion: sectionNumber
                })
            });

            const responseData = await response.json();
            studentsListSection.innerHTML = '';

            // --- Detección temprana de sección sin horario ---
            if (response.ok && responseData.sin_horario === true) {
                studentsListSection.innerHTML = `
                    <div class="no-schedule-warning fade-in" role="alert" aria-live="assertive">
                        <div class="no-schedule-warning__icon" aria-hidden="true">⚠️</div>
                        <h3 class="no-schedule-warning__title">Horario no configurado</h3>
                        <p class="no-schedule-warning__message">
                            debes crear el horario de la seccion
                        </p>
                        <p class="no-schedule-warning__hint">
                            Ve al módulo de <strong>Horarios</strong> y asigna un horario a
                            <strong>${gradeStr} – ${sectionStr}</strong> para poder registrar calificaciones.
                        </p>
                    </div>
                `;
                return;
            }
            // -------------------------------------------------

            const students = Array.isArray(responseData.estudiantes) ? responseData.estudiantes : [];

            const title = document.createElement('h2');
            title.className = 'student-list-header';
            title.textContent = `Estudiantes - ${gradeStr}, ${sectionStr}`;
            studentsListSection.appendChild(title);

            if (!response.ok || students.length === 0) {
                studentsListSection.innerHTML += `
                    <div class="no-students-message text-center card fade-in">
                        <div class="no-students-icon">📚</div>
                        <h3 class="no-students-title">No hay estudiantes registrados</h3>
                        <p class="no-students-subtitle">Selecciona otro grado y sección o verifica las inscripciones.</p>
                    </div>
                `;
            } else {
                students.forEach(student => {
                    const stuData = {
                        id: student.EstudianteId,
                        name: `${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}`,
                        ci: student.DatosPersona.Cedula,
                        gender: student.DatosPersona.Sexo,
                        avatar: student.DatosPersona.Nombre.charAt(0) + student.DatosPersona.Apellido.charAt(0),
                        saved: false,
                        grades: {} // Maintains mocked modal structure compatibility
                    };
                    studentData[stuData.id] = stuData;
                    renderStudentCard(stuData, student.DatosPersona.Sexo.toLowerCase() === 'masculino' ? 'blue' : 'pink');
                });

                // --- Validación de estado de calificaciones ---
                const allStudentIds = students.map(s => s.EstudianteId);
                try {
                    const statusResponse = await fetch(`${window.APP_CONFIG.api_url}/calification/grade_status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            StudentIds: allStudentIds,
                            CursoId: courseId
                        })
                    });
                    if (statusResponse.ok) {
                        const statusMap = await statusResponse.json();
                        Object.keys(statusMap).forEach(studentId => {
                            const card = studentsListSection.querySelector(`[data-student-id="${studentId}"]`);
                            if (card) {
                                const statusIcon = card.querySelector('.status-icon');
                                if (statusIcon) {
                                    if (statusMap[studentId] === true) {
                                        // Notas completas: reemplazar con ✅
                                        statusIcon.outerHTML = '<span class="status-icon status-complete" title="Calificaciones completas" style="font-size: 18px; line-height: 1;">✅</span>';
                                        card.classList.add('saved');
                                        if (studentData[studentId]) {
                                            studentData[studentId].saved = true;
                                        }
                                    }
                                    // Si es false, el ícono de exclamación ya está renderizado por defecto
                                }
                            }
                        });
                    }
                } catch (statusErr) {
                    console.error('Error al verificar estado de calificaciones:', statusErr);
                }

                // --- Obtener estatus académico (materias reprobadas) ---
                await fetchAndRenderAcademicStatus(allStudentIds, courseId);
            }
        } catch (error) {
            console.error('Error al cargar estudiantes:', error);
            studentsListSection.innerHTML = `<div class="text-center fade-in" style="padding: 2rem; color:red;">${error.message || 'Error al cargar estudiantes'}</div>`;
        }
    });


    function renderStudentCard(student, avatarColor = '') {
        const savedClass = student.saved ? 'saved' : '';
        const savedIcon = student.saved ? `
            <svg class="status-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ` : `
            <svg class="status-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12V8M8 4.005H8.005M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="#F97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const cardHtml = `
            <div class="student-card ${savedClass} fade-in" data-student-id="${student.id}">
                <div class="student-card__info">
                    <div class="student-card__avatar ${avatarColor}">${student.avatar}</div>
                    <div class="student-card__name-wrapper">
                        <p class="student-card__name">${student.name}</p>
                        <p class="student-card__ci">C.I: ${student.ci || ''} • ${student.gender || 'Masculino'}</p>
                        <span class="academic-status-badge" id="academic-status-${student.id}"></span>
                    </div>
                    ${savedIcon}
                </div>
                <svg class="action-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        studentsListSection.insertAdjacentHTML('beforeend', cardHtml);

        // Añadir listener de clic a la tarjeta
        const newCard = studentsListSection.lastElementChild;
        newCard.addEventListener('click', () => openGradesModal(student));
    }

    /**
     * Actualiza la etiqueta de estatus académico de un estudiante en su tarjeta.
     * @param {string} studentId - ID del estudiante
     * @param {number} reprobadas - Cantidad de materias reprobadas
     */
    function updateAcademicStatusBadge(studentId, reprobadas) {
        const badge = document.getElementById(`academic-status-${studentId}`);
        if (!badge) return;

        // Limpiar clases previas
        badge.classList.remove('badge-warning', 'badge-danger');
        badge.textContent = '';
        badge.style.display = 'none';

        if (reprobadas >= 3) {
            badge.textContent = 'Estudiante reprobado';
            badge.classList.add('badge-danger');
            badge.style.display = 'inline-flex';
        } else if (reprobadas >= 1) {
            badge.textContent = `${reprobadas} materia${reprobadas > 1 ? 's' : ''} pendiente${reprobadas > 1 ? 's' : ''}`;
            badge.classList.add('badge-warning');
            badge.style.display = 'inline-flex';
        }
        // Si es 0, no se muestra nada
    }

    /**
     * Obtiene y renderiza el estatus académico de todos los estudiantes cargados.
     * @param {string[]} allStudentIds - Array de IDs de estudiantes
     * @param {string} courseId - ID del curso seleccionado
     */
    async function fetchAndRenderAcademicStatus(allStudentIds, courseId) {
        try {
            const response = await fetch(`${window.APP_CONFIG.api_url}/calification/academic_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    StudentIds: allStudentIds,
                    CursoId: courseId
                })
            });
            if (response.ok) {
                const statusMap = await response.json();
                Object.keys(statusMap).forEach(studentId => {
                    updateAcademicStatusBadge(studentId, statusMap[studentId]);
                });
            }
        } catch (err) {
            console.error('Error al obtener estatus académico:', err);
        }
    }

    // Lógica del Modal
    async function openGradesModal(student) {
        currentStudentId = student.id;
        modalStudentName.textContent = student.name;
        modalBackStudentName.textContent = student.name;
        gradesForm.innerHTML = ''; // Limpiar anterior

        // Mostrar Loader
        const loader = document.createElement("loader-spinner");
        gradesForm.appendChild(loader);

        try {
            const [subjectsResponse, gradesResponse] = await Promise.all([
                fetch(`${window.APP_CONFIG.api_url}/students/${student.id}/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${window.APP_CONFIG.api_url}/calification/student/${student.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            // La nueva API retorna { sin_horario: bool, materias: [...] }
            const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : null;
            const gradesData = gradesResponse.ok ? await gradesResponse.json() : [];

            gradesForm.innerHTML = ''; // Quitar loader

            // --- Manejo de error de red/servidor ---
            if (!subjectsResponse.ok || !subjectsData) {
                gradesForm.innerHTML = '<p class="text-center fade-in" style="padding: 2rem; color:var(--danger-color, #dc2626);">Error al cargar las materias. Intente de nuevo.</p>';
                modalBackLink.onclick = (e) => { e.preventDefault(); closeModal(); };
                gradesModal.classList.add('open');
                return;
            }

            // --- Caso normal: hay materias desde el horario (sin_horario siempre false aquí) ---
            // Restaurar botón guardar por si estaba oculto de una apertura previa
            if (saveGradesBtn) saveGradesBtn.style.display = '';


            const materias = subjectsData.materias || [];

            // Mapeo dinámico de notas existentes hacia lapsos
            student.grades = {};
            student.originalGrades = {};
            student.convalidadas = {}; // { materiaId: { lapso1: bool, lapso2: bool, lapso3: bool } }
            materias.forEach(m => {
                student.grades[m.id] = {};
                student.originalGrades[m.id] = {};
                student.convalidadas[m.id] = {};
            });
            if (Array.isArray(gradesData)) {
                gradesData.forEach(g => {
                    if (student.grades[g.MateriaId]) {
                        student.grades[g.MateriaId][`lapso${g.LapsoNumero}`] = g.Ponderacion;
                        student.originalGrades[g.MateriaId][`lapso${g.LapsoNumero}`] = g.Ponderacion;
                        student.convalidadas[g.MateriaId][`lapso${g.LapsoNumero}`] = g.Convalidada === true;
                    }
                });
            }

            if (materias.length === 0) {
                gradesForm.innerHTML = '<p class="text-center fade-in" style="padding: 2rem; color: var(--text-muted, #6b7280);">No se encontraron materias asignadas para la sección de este estudiante.</p>';
                modalBackLink.onclick = (e) => { e.preventDefault(); closeModal(); };
                gradesModal.classList.add('open');
                return;
            }

            currentStudentSubjects = materias;

            materias.forEach(subject => {
                const convalidadasMateria = (student.convalidadas || {})[subject.id] || {};
                const subjectCard = createSubjectCard(subject, student.grades[subject.id], convalidadasMateria);
                gradesForm.appendChild(subjectCard);
            });
        } catch (error) {
            console.error('Error al cargar materias:', error);
            gradesForm.innerHTML = '<p class="text-center fade-in" style="padding: 2rem; color:var(--danger-color, #dc2626);">Error al cargar las materias. Intente de nuevo.</p>';
        }

        modalBackLink.onclick = (e) => { e.preventDefault(); closeModal(); };
        gradesModal.classList.add('open');
    }

    function createSubjectCard(subject, existingGrades = {}, convalidadasMap = {}) {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.id = `subject-${subject.id}`;

        const lapsosData = [
            { id: 1, label: '1ER LAPSO' },
            { id: 2, label: '2DO LAPSO' },
            { id: 3, label: '3ER LAPSO' }
        ];

        // Verificar si TODOS los lapsos de esta materia están convalidados
        const todosConvalidados = lapsosData.every(l => convalidadasMap[`lapso${l.id}`] === true);

        let inputsHtml = '<div class="lapsos-container">';
        let summariesHtml = '<div class="summary-row">';
        let initialGradesValid = true;

        lapsosData.forEach(lapso => {
            const gradeKey = `lapso${lapso.id}`;
            const existingGrade = existingGrades[gradeKey] ?? '';
            const esConvalidada = convalidadasMap[gradeKey] === true;
            if (existingGrade !== '' && !validateGrade(existingGrade)) {
                initialGradesValid = false;
            }

            let isReadonly = '';
            let stateClass = '';
            let tooltip = '';

            if (existingGrade !== '') {
                isReadonly = 'readonly disabled';
            } else if (!lapsosStatus[`lapso${lapso.id}_abierto`]) {
                isReadonly = 'disabled';
                stateClass = 'locked-lapso-input';
                tooltip = 'title="Lapso Cerrado. Abre en la última semana del lapso."';
            }

            // Botón de edición: ocultar para notas convalidadas
            const editIcon = (existingGrade !== '' && !esConvalidada) ? `
                <button type="button" class="btn-icon edit-single-grade" data-subject="${subject.id}" data-lapso="${lapso.id}" data-value="${existingGrade}" style="margin-left:8px; color:var(--primary-color);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                       <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            ` : '';

            inputsHtml += `
                <div class="lapso-input-wrapper">
                    <label for="${subject.id}_lapso${lapso.id}">${lapso.label}</label>
                    <div style="display: flex; align-items: center;">
                       <input type="number" id="${subject.id}_lapso${lapso.id}" class="form-control grade-input ${stateClass}" placeholder="0-20" min="0" max="20" value="${existingGrade}" step="1" ${isReadonly} ${tooltip}>
                       ${editIcon}
                    </div>
                </div>
            `;

            summariesHtml += `
                <div class="summary-block empty" id="${subject.id}_summary_lapso${lapso.id}">
                    <span>${lapso.label}</span>
                    <span class="value">-</span>
                </div>
            `;
        });
        inputsHtml += '</div>';
        summariesHtml += '</div>';

        // Badge "notas ya cargadas" solo si todos los lapsos son convalidados
        const convalidadaBadge = todosConvalidados
            ? `<span class="convalidada-badge" title="Notas migradas automáticamente por convalidación. No pueden modificarse." style="display:inline-flex;align-items:center;gap:4px;margin-left:8px;padding:2px 8px;border-radius:12px;background:#dcfce7;color:#166534;font-size:11px;font-weight:600;letter-spacing:.3px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  notas ya cargadas
               </span>`
            : '';

        card.innerHTML = `
            <h3 class="subject-card__title">${subject.name}${convalidadaBadge}</h3>
            ${inputsHtml}
            ${summariesHtml}
            <div class="final-summary-row hidden" id="${subject.id}_final_summary">
                <div class="final-summary-item">
                    <span class="label-title">PROMEDIO</span>
                    <span class="value-text" id="${subject.id}_average">-</span>
                </div>
                <div class="final-summary-item state-wrapper">
                    <span class="label-title">ESTADO</span>
                    <span id="${subject.id}_status_icon" class="hidden">
                        <svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                         <svg class="x-icon hidden" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4L4 12M4 4L12 12" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span class="value-text" id="${subject.id}_status_text">Reprobado</span>
                </div>
            </div>
        `;


        // Añadir event listeners a los inputs
        card.querySelectorAll('.grade-input').forEach(input => {
            input.addEventListener('input', (e) => {
                let val = e.target.value;
                // Dejar solo números enteros
                val = val.replace(/[^0-9]/g, '');
                // Borrar automáticamente si pasa de 2 caracteres
                if (val.length > 2) {
                    val = val.substring(0, 2);
                }
                // Si el valor numérico es mayor a 20, forzar a 20 o resetear
                if (val !== '' && parseInt(val, 10) > 20) {
                    val = '20';
                    input.classList.add('is-invalid');
                    setTimeout(() => input.classList.remove('is-invalid'), 500);
                }
                if (e.target.value !== val) {
                    e.target.value = val;
                }
                updateSubjectSummary(subject.id);
            });
        });

        // Si existen notas válidas, hacer actualización inicial
        if (initialGradesValid) {
            setTimeout(() => updateSubjectSummary(subject.id), 0); // dejar que el DOM se actualice primero
        }

        // Lógica para abrir el modal de edición única
        card.querySelectorAll('.edit-single-grade').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSingleEditData = {
                    subjectId: btn.dataset.subject,
                    lapsoId: btn.dataset.lapso,
                    currentValue: document.getElementById(`${btn.dataset.subject}_lapso${btn.dataset.lapso}`).value
                };
                singleEditCurrentGrade.textContent = currentSingleEditData.currentValue;
                singleEditNewGrade.value = '';
                singleEditJustification.value = '';
                singleEditModal.classList.add('open');
            });
        });

        return card;
    }

    function updateSubjectSummary(subjectId) {
        const card = document.getElementById(`subject-${subjectId}`);
        const inputs = card.querySelectorAll('.grade-input');
        const finalSummary = document.getElementById(`${subjectId}_final_summary`);
        const averageSpan = document.getElementById(`${subjectId}_average`);
        const statusSpan = document.getElementById(`${subjectId}_status_text`);
        const statusIconWrapper = document.getElementById(`${subjectId}_status_icon`);
        const checkIcon = statusIconWrapper.querySelector('.check-icon');
        const xIcon = statusIconWrapper.querySelector('.x-icon');

        let grades = [];
        let allInputsFilledValid = true;

        inputs.forEach((input, index) => {
            const lapsoId = index + 1;
            const summaryBlock = document.getElementById(`${subjectId}_summary_lapso${lapsoId}`);
            const summaryValue = summaryBlock.querySelector('.value');
            let inputValue;

            // Verificación maliciosa para validación solo de JS
            if (isInputModifiedManually(input)) {
                inputValue = input.value; // Texto ahora
            } else {
                inputValue = input.valueAsNumber;
            }

            summaryBlock.classList.remove('approved', 'failed');
            summaryBlock.classList.add('empty');
            summaryValue.textContent = '-';
            summaryValue.innerHTML = ''; // resetear innerHTML para iconos

            input.classList.remove('is-invalid'); // estado is-invalid personalizado

            if (inputValue !== '' && inputValue !== null && !isNaN(inputValue)) {
                if (validateGrade(inputValue)) {
                    const grade = parseFloat(inputValue);
                    grades.push(grade);
                    summaryValue.textContent = grade.toFixed(1);
                    summaryBlock.classList.remove('empty');
                    if (grade >= 10) {
                        summaryBlock.classList.add('approved');
                        summaryValue.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="#059669" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> ${grade.toFixed(1)}`;
                    } else {
                        summaryBlock.classList.add('failed');
                        summaryValue.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3L3 9M3 3L9 9" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> ${grade.toFixed(1)}`;
                    }
                } else {
                    allInputsFilledValid = false;
                    // Marcar visualmente inválido, podría usar estilo personalizado
                    input.classList.add('is-invalid');
                }
            } else if (inputValue === '' || isNaN(inputValue)) {
                allInputsFilledValid = false;
            }
        });

        // Actualizar promedio general del sujeto y estado si las 3 notas están presentes y son válidas
        if (grades.length === 3 && allInputsFilledValid) {
            const average = calculateAverage(grades);
            averageSpan.textContent = average;
            finalSummary.classList.remove('hidden');

            if (parseFloat(average) >= 9.5) { // Umbral de aprobado
                finalSummary.classList.remove('failed');
                finalSummary.classList.add('approved'); // no explícitamente fallando, usar fondo verde
                statusSpan.textContent = 'Aprobado';
                statusIconWrapper.classList.remove('hidden');
                checkIcon.classList.remove('hidden');
                xIcon.classList.add('hidden');
            } else {
                finalSummary.classList.remove('approved');
                finalSummary.classList.add('failed');
                statusSpan.textContent = 'Reprobado';
                statusIconWrapper.classList.remove('hidden');
                checkIcon.classList.add('hidden');
                xIcon.classList.remove('hidden');
            }
        } else {
            finalSummary.classList.add('hidden');
            averageSpan.textContent = '-';
            statusSpan.textContent = '-';
            statusIconWrapper.classList.add('hidden');
        }
    }

    function closeModal() {
        gradesModal.classList.remove('open');
        currentStudentId = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelGradesBtn.addEventListener('click', closeModal);

    // Funciones del Modal de Justificación
    const closeJustificationModal = () => {
        justificationModal.style.display = 'none';
        justificationText.value = '';
    };

    cancelJustificationBtn.addEventListener('click', closeJustificationModal);

    // Funciones del Modal de Edición Única
    closeSingleEditBtn.addEventListener('click', () => {
        singleEditModal.classList.remove('open');
    });

    singleEditNewGrade.addEventListener('input', (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9]/g, '');
        if (val.length > 2) {
            val = val.substring(0, 2);
        }
        if (val !== '' && parseInt(val, 10) > 20) {
            val = '20';
            e.target.classList.add('is-invalid');
            setTimeout(() => e.target.classList.remove('is-invalid'), 500);
        }
        if (e.target.value !== val) {
            e.target.value = val;
        }
    });

    confirmSingleEditBtn.addEventListener('click', async () => {
        const newGrade = singleEditNewGrade.value;
        const justification = singleEditJustification.value.trim();

        if(!validateGrade(newGrade)) {
            alert('Ingrese una nota válida (0-20)');
            return;
        }
        if(!justification) {
            alert('La justificación es obligatoria');
            return;
        }

        confirmSingleEditBtn.disabled = true;
        try {
             const payload = [{
                 Ponderacion: newGrade,
                 MateriaId: currentSingleEditData.subjectId,
                 EstudianteId: currentStudentId,
                 LapsoId: currentLapsosMapping[`lapso${currentSingleEditData.lapsoId}`],
                 Justificacion: justification
             }];
             const uploadPromise = await fetch(`${window.APP_CONFIG.api_url}/calification/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!uploadPromise.ok) {
                const errorData = await uploadPromise.json();
                throw new Error(errorData.message || "Error editando calificación");
            }
            
            // Actualizar la UI localmente
            const input = document.getElementById(`${currentSingleEditData.subjectId}_lapso${currentSingleEditData.lapsoId}`);
            input.value = newGrade;
            studentData[currentStudentId].grades[currentSingleEditData.subjectId][`lapso${currentSingleEditData.lapsoId}`] = newGrade;
            studentData[currentStudentId].originalGrades[currentSingleEditData.subjectId][`lapso${currentSingleEditData.lapsoId}`] = newGrade;
            
            input.dispatchEvent(new Event('input'));
            
            singleEditModal.classList.remove('open');
            alert("Nota modificada con éxito.");
        } catch (e) {
             alert(e.message || "Error desconocido");
        } finally {
             confirmSingleEditBtn.disabled = false;
        }
    });

    const performSaveGrades = async (justification = null) => {
        // Enviar notas al backend
        let calificationsPayload = [];
        
        currentStudentSubjects.forEach(subject => {
            const card = document.getElementById(`subject-${subject.id}`);
            const inputs = card.querySelectorAll('.grade-input');
            
            // Construimos el payload individual por materia/lapso
            ['lapso1', 'lapso2', 'lapso3'].forEach((lKey, index) => {
                const val = inputs[index].value;
                if(val && val !== '') {
                    let item = {
                        Ponderacion: val,
                        MateriaId: subject.id,
                        EstudianteId: currentStudentId,
                        LapsoId: currentLapsosMapping[lKey]
                    };
                    if (justification) {
                        item.Justificacion = justification;
                    }
                    calificationsPayload.push(item);
                }
            });
            
            studentData[currentStudentId].grades[subject.id] = {
                lapso1: inputs[0].value,
                lapso2: inputs[1].value,
                lapso3: inputs[2].value,
                average: parseFloat(document.getElementById(`${subject.id}_average`).textContent)
            };
        });

        saveGradesBtn.disabled = true;
        
        try {
            const uploadPromise = await fetch(`${window.APP_CONFIG.api_url}/calification/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(calificationsPayload)
            });

            if (!uploadPromise.ok) {
                const errorData = await uploadPromise.json();
                throw new Error(errorData.message || "Error guardando calificaciones");
            }
            
            // Establecer estado saved basado en materias llenas
            if (Object.keys(studentData[currentStudentId].grades).length === currentStudentSubjects.length) {
                studentData[currentStudentId].saved = true;
            }

            // Mostrar toast
            showToast(studentData[currentStudentId].name);

            // Actualizar la tarjeta del estudiante en la lista principal
            const updatedCard = studentsListSection.querySelector(`[data-student-id="${currentStudentId}"]`);
            if (updatedCard) {
                // Re-verificar estado de completitud via API
                try {
                    const reCheckResponse = await fetch(`${window.APP_CONFIG.api_url}/calification/grade_status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            StudentIds: [currentStudentId],
                            CursoId: gradeSelect.value
                        })
                    });
                    if (reCheckResponse.ok) {
                        const reCheckMap = await reCheckResponse.json();
                        const isComplete = reCheckMap[currentStudentId] === true;
                        const statusIcon = updatedCard.querySelector('.status-icon');
                        if (isComplete) {
                            updatedCard.classList.add('saved');
                            if (statusIcon) {
                                statusIcon.outerHTML = '<span class="status-icon status-complete" title="Calificaciones completas" style="font-size: 18px; line-height: 1;">✅</span>';
                            }
                        } else {
                            // Mantener/restaurar ícono de exclamación
                            if (statusIcon && !statusIcon.querySelector('path[d*="8 12V8"]')) {
                                statusIcon.outerHTML = `
                                    <svg class="status-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 12V8M8 4.005H8.005M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="#F97316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                `;
                            }
                        }
                    }
                } catch(recheckErr) {
                    console.error('Error re-verificando estado:', recheckErr);
                }

                // Re-obtener estatus académico tras guardar notas
                await fetchAndRenderAcademicStatus([currentStudentId], gradeSelect.value);
            }
        } catch(e) {
            alert(e.message);
        } finally {
            saveGradesBtn.disabled = false;
            closeModal();
            closeJustificationModal();
        }
    };

    confirmJustificationBtn.addEventListener('click', () => {
        const reason = justificationText.value.trim();
        if(!reason) {
            alert('Debe escribir la justificación.');
            return;
        }
        performSaveGrades(reason);
    });

    // Lógica de Guardar Calificaciones Original (interceptada)
    saveGradesBtn.addEventListener('click', () => {
        if (!currentStudentId) return;

        const allCardsValid = Array.from(gradesForm.querySelectorAll('.subject-card')).every(card => {
            const finalSummary = card.querySelector('.final-summary-row');
            const averageText = card.querySelector('.final-summary-item .value-text').textContent;
            return !finalSummary.classList.contains('hidden') && averageText !== '-';
        });

        if (!allCardsValid) {
            alert('Por favor carga todas las calificaciones válidas para todas las materias.');
            return;
        }

        // Verificar si se editó alguna nota ya existente de manera distinta
        let isModified = false;
        currentStudentSubjects.forEach(subject => {
            const card = document.getElementById(`subject-${subject.id}`);
            const inputs = card.querySelectorAll('.grade-input');
            
            const l1 = inputs[0].value;
            const l2 = inputs[1].value;
            const l3 = inputs[2].value;

            const orig1 = studentData[currentStudentId].originalGrades[subject.id]?.lapso1 || '';
            const orig2 = studentData[currentStudentId].originalGrades[subject.id]?.lapso2 || '';
            const orig3 = studentData[currentStudentId].originalGrades[subject.id]?.lapso3 || '';

            if ((orig1 !== '' && parseFloat(l1) !== parseFloat(orig1)) ||
                (orig2 !== '' && parseFloat(l2) !== parseFloat(orig2)) ||
                (orig3 !== '' && parseFloat(l3) !== parseFloat(orig3))) {
                isModified = true;
            }
        });

        if (isModified) {
            // Mostrar modal secundario para pedir justificación
            justificationModal.style.display = 'flex';
        } else {
            // Guardado normal sin justificación
            performSaveGrades(null);
        }
    });

    // Lógica del Toast
    function showToast(studentName) {
        toastStudentName.textContent = studentName;
        toastNotification.classList.remove('hidden');
        toastNotification.classList.add('show');

        setTimeout(() => {
            toastNotification.classList.remove('show');
            setTimeout(() => {
                toastNotification.classList.add('hidden');
            }, 300); // coincide con la transición de salida en CSS
        }, 3000); // 3 segundos de visibilidad
    }

    // Cerrar modal al hacer clic en el fondo
    window.addEventListener('click', (event) => {
        if (event.target === gradesModal) {
            closeModal();
        }
    });

    gradeSelect.addEventListener("change", () => {
        const courseId = gradeSelect.value;
        const course = courses.find(c => c.CursoId === courseId);
        sectionSelect.innerHTML = "";
        sectionSelect.disabled = false;
        for (let i = 0; i < course.Seccion; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = numberToLetter(i + 1);
            sectionSelect.appendChild(option);
        }
    });

    // Lógica del Historial de Cambios
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const historyTableBody = document.getElementById('historyTableBody');

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', async () => {
            historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 1rem;"><loader-spinner></loader-spinner></td></tr>';
            historyModal.classList.add('open');

            try {
                const response = await fetch(`${window.APP_CONFIG.api_url}/calification/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Error al obtener el historial');
                
                const data = await response.json();
                historyTableBody.innerHTML = '';
                
                if (data.length === 0) {
                    historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1rem;">No hay registros de modificaciones de notas.</td></tr>';
                } else {
                    data.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.Estudiante}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.Ano || 'N/A'}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.Materia}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.NotaAnterior}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><b>${row.NotaNueva}</b></td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.Justificacion || '-'}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${row.FechaCambio}</td>
                        `;
                        historyTableBody.appendChild(tr);
                    });
                }

            } catch (err) {
                console.error(err);
                historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1rem; color: red;">Error cargando historial</td></tr>';
            }
        });
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.remove('open');
        });
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.classList.remove('open');
        }
    });

});