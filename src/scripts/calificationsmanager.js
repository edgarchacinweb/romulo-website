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

    // Obtener los IDs de los lapsos actuales a nivel global
    try {
        const lapsosResponse = await fetch(`${window.APP_CONFIG.api_url}/lapsos/current`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(lapsosResponse.ok) {
            const dataLapsos = await lapsosResponse.json();
            dataLapsos.lapsos.forEach(l => { currentLapsosMapping[`lapso${l.lapso}`] = l.lapso_id; });
        }
    } catch(err) {
        console.error("Error cargando lapsos", err);
    }

    // Elementos del modal de Justificación
    const justificationModal = document.getElementById('justificationModal');
    const justificationText = document.getElementById('justificationText');
    const confirmJustificationBtn = document.getElementById('confirmJustificationBtn');
    const cancelJustificationBtn = document.getElementById('cancelJustificationBtn');

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
            data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.CursoId;
                option.textContent = `${course.Grado}° Año`;
                gradeSelect.appendChild(option);
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

            const students = await response.json();
            studentsListSection.innerHTML = '';

            const title = document.createElement('h2');
            title.className = 'student-list-header';
            title.textContent = `Estudiantes - ${gradeStr}, ${sectionStr}`;
            studentsListSection.appendChild(title);

            if (!response.ok || !Array.isArray(students) || students.length === 0) {
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
            const materias = await subjectsResponse.json();
            const gradesData = gradesResponse.ok ? await gradesResponse.json() : [];

            // Mapeo dinamico de notas hacia lapsos
            student.grades = {};
            student.originalGrades = {};
            if (Array.isArray(materias)) {
                materias.forEach(m => {
                    student.grades[m.id] = {};
                    student.originalGrades[m.id] = {};
                });
            }
            if (Array.isArray(gradesData)) {
                gradesData.forEach(g => {
                    if (student.grades[g.MateriaId]) {
                        student.grades[g.MateriaId][`lapso${g.LapsoNumero}`] = g.Ponderacion;
                        student.originalGrades[g.MateriaId][`lapso${g.LapsoNumero}`] = g.Ponderacion;
                    }
                });
            }

            gradesForm.innerHTML = ''; // Quitar loader

            if (!subjectsResponse.ok || !Array.isArray(materias) || materias.length === 0) {
                gradesForm.innerHTML = '<p class="text-center fade-in" style="padding: 2rem; color:red;">No se encontraron materias asignadas para la sección de este estudiante.</p>';
                return;
            }

            currentStudentSubjects = materias;

            materias.forEach(subject => {
                const subjectCard = createSubjectCard(subject, student.grades[subject.id]);
                gradesForm.appendChild(subjectCard);
            });
        } catch (error) {
            console.error('Error al cargar materias:', error);
            gradesForm.innerHTML = '<p class="text-center fade-in" style="padding: 2rem; color:red;">Error al cargar las materias. Intente de nuevo.</p>';
        }

        modalBackLink.onclick = (e) => { e.preventDefault(); closeModal(); };
        gradesModal.classList.add('open');
    }

    function createSubjectCard(subject, existingGrades = {}) {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.id = `subject-${subject.id}`;

        const lapsosData = [
            { id: 1, label: '1ER LAPSO' },
            { id: 2, label: '2DO LAPSO' },
            { id: 3, label: '3ER LAPSO' }
        ];

        let inputsHtml = '<div class="lapsos-container">';
        let summariesHtml = '<div class="summary-row">';
        let initialGradesValid = true;

        lapsosData.forEach(lapso => {
            const gradeKey = `lapso${lapso.id}`;
            const existingGrade = existingGrades[gradeKey] ?? '';
            if (existingGrade !== '' && !validateGrade(existingGrade)) {
                initialGradesValid = false;
            }

            inputsHtml += `
                <div class="lapso-input-wrapper">
                    <label for="${subject.id}_lapso${lapso.id}">${lapso.label}</label>
                    <input type="number" id="${subject.id}_lapso${lapso.id}" class="form-control grade-input" placeholder="0-20" min="0" max="20" value="${existingGrade}" step="0.1">
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

        card.innerHTML = `
            <h3 class="subject-card__title">${subject.name}</h3>
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
            input.addEventListener('input', () => updateSubjectSummary(subject.id));
        });

        // Si existen notas válidas, hacer actualización inicial
        if (initialGradesValid) {
            setTimeout(() => updateSubjectSummary(subject.id), 0); // dejar que el DOM se actualice primero
        }

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
                updatedCard.classList.add('saved');
                const statusIcon = updatedCard.querySelector('.status-icon');
                if(statusIcon) {
                    statusIcon.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `;
                }
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

});