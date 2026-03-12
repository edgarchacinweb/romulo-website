import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("administrador");
const token = localStorage.getItem("auth");

/* DOM Elements */
const notifications = document.getElementById('notifications');
const selectEstudiante = document.getElementById('selectEstudiante');
const selectPeriodo = document.getElementById('selectPeriodo');
const selectGrado = document.getElementById('selectGrado');
const selectSeccion = document.getElementById('selectSeccion');
const emptyState = document.getElementById('emptyState');
const gradesSection = document.getElementById('gradesSection');
const studentAlert = document.getElementById('studentAlert');
const studentNameAlert = document.getElementById('studentNameAlert');
const studentNameTitle = document.getElementById('studentNameTitle');
const gradesBody = document.getElementById('gradesBody');
const btnSave = document.getElementById('btnSave');
const btnExport = document.getElementById('btnExport');
const btnLogout = document.getElementById('btnLogout');
const btnClear = document.getElementById('btnClear');
const appContainer = document.getElementById('app');
const loader = document.createElement('loader-spinner');

let terms = [];
let grades = [];
let students = [];
let subjects = [];

const emptyStateDissapear = () => {
    emptyState.classList.remove('hidden');
    gradesSection.classList.add('hidden');
    studentAlert.classList.add('hidden');

    btnSave.disabled = true;
    btnExport.disabled = true;
}

const loadStudents = async () => {
    const periodoEscolarId = selectPeriodo.value;
    const cursoId = selectGrado.value;
    const seccion = selectSeccion.value;

    const studentsPromise = await fetch(`${window.APP_CONFIG.api_url}/students/filter`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            PeriodoEscolarId: periodoEscolarId,
            CursoId: cursoId,
            Seccion: seccion,
            Estado: "inscrito"
        })
    });

    const studentsResponse = await studentsPromise.json();
    if (!studentsPromise.ok) {
        throw new Error(studentsResponse.message);
    }

    students = [...studentsResponse];
    selectEstudiante.innerHTML = "<option value='' disabled selected>Seleccione un estudiante</option>";
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.EstudianteId;
        option.textContent = `${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido} ${student.DatosPersona.Cedula}`;
        selectEstudiante.appendChild(option);
    });
}

const loadSections = async () => {
    // Obteniendo ID del grado seleccionado
    const cursoId = selectGrado.value;
    selectSeccion.innerHTML = "";
    const sections = grades.find(grade => grade.CursoId === cursoId);

    for (let i = 1; i <= sections.Secciones; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = numberToLetter(i);
        selectSeccion.appendChild(option);
    }

    await loadStudents();
}

const loadGrades = async () => {
    // Obteniendo ID del periodo escolar seleccionado
    const periodoEscolarId = selectPeriodo.value;

    // Cargando secciones y grados
    const sectionsPromise = await fetch(`${window.APP_CONFIG.api_url}/course/sections/${periodoEscolarId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    const sectionsResponse = await sectionsPromise.json();
    if (!sectionsPromise.ok) {
        throw new Error(sectionsResponse.message);
    }

    grades = Array.from(new Set(sectionsResponse.map(section => ({ CursoId: section.CursoId, Grado: section.Grado, Secciones: section.Seccion })))).sort((a, b) => a.Grado - b.Grado);

    // Mapeando Select de Grado
    selectGrado.innerHTML = "";
    grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade.CursoId;
        option.textContent = `${grade.Grado}° Año`;
        selectGrado.appendChild(option);
    });

    loadSections();
}

document.addEventListener("DOMContentLoaded", async () => {
    appContainer.appendChild(loader);

    // Carga inicial de datos
    try {
        // Cargar datos del usuario
        const userPromise = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const userResponse = await userPromise.json();
        if (!userPromise.ok) {
            throw new Error("Error al cargar los datos del usuario");
        }

        document.querySelector(".header__role").textContent = userResponse.Rol;
        document.querySelector(".header__email").textContent = userResponse.Email;

        // Cargar periodos escolares
        const termsPromise = await fetch(`${window.APP_CONFIG.api_url}/school_term/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        // Carga de materias
        const subjectsPromise = await fetch(`${window.APP_CONFIG.api_url}/subject/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const subjectsResponse = await subjectsPromise.json();
        if (!subjectsPromise.ok) {
            throw new Error("Error al cargar las materias");
        } else if (subjectsResponse.length === 0) {
            throw new Error("No hay materias registradas");
        }

        subjects = [...subjectsResponse];
        console.log(subjects);
        // Carga de periodos escolares
        const termsResponse = await termsPromise.json();
        if (!termsPromise.ok) {
            throw new Error("Error al cargar los periodos escolares");
        } else if (termsResponse.length === 0) {
            throw new Error("No hay periodos escolares registrados");
        }

        terms = [...termsResponse];
        selectPeriodo.innerHTML = "";
        terms.forEach(term => {
            const option = document.createElement('option');
            option.value = term.PeriodoEscolarId;
            option.textContent = `${new Date(term.FechaInicio).getFullYear()} - ${new Date(term.FechaFin).getFullYear()}`;
            selectPeriodo.appendChild(option);
        });

        await loadGrades();
    } catch (error) {
        console.error(error.stack);
        const notification = document.createElement('notification-component');
        notification.setAttribute('type', 'error');
        notification.setAttribute('message', error.message);
        notifications.appendChild(notification);
        document.body.style.pointerEvents = "none";
        setTimeout(() => {
            btnLogout.click();
        }, 2000);
    } finally {
        loader.remove();
    }
});

selectPeriodo.addEventListener('change', async () => {
    emptyStateDissapear();
    await loadGrades();
});

selectGrado.addEventListener('change', async () => {
    emptyStateDissapear();
    await loadSections();
});

selectSeccion.addEventListener('change', async () => {
    emptyStateDissapear();
    await loadStudents();
});

/* Mock Data */
const materias = [
    "Matemática",
    "Lengua y Literatura",
    "Historia de Venezuela",
    "Biología",
    "Física",
    "Química",
    "Educación Física",
    "Artes Plásticas"
];

/* Render Table */
function renderGradesTable() {
    gradesBody.innerHTML = '';

    materias.forEach((materia, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${materia}</td>
            <td><input type="number" class="grades__input js-grade" data-materia="${index}" min="0" max="20" placeholder="-"></td>
            <td><input type="number" class="grades__input js-grade" data-materia="${index}" min="0" max="20" placeholder="-"></td>
            <td><input type="text" class="grades__input grades__input--locked" value="-" readonly></td>
            <td class="grades__promedio js-promedio" data-materia="${index}">-</td>
        `;

        gradesBody.appendChild(tr);
    });

    const inputs = document.querySelectorAll('.js-grade');
    inputs.forEach(input => {
        input.addEventListener('input', handleGradeInput);
    });
}

/* Validations and Calculations */
function handleGradeInput(e) {
    let val = parseInt(e.target.value);

    if (val < 0) e.target.value = 0;
    if (val > 20) e.target.value = 20;
    if (isNaN(val) && e.target.value !== '') {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    }

    calculateAverages();
    checkFormCompletion();
}

function calculateAverages() {
    const promedios = document.querySelectorAll('.js-promedio');

    promedios.forEach((promedioCell, index) => {
        const rowInputs = document.querySelectorAll(`.js-grade[data-materia="${index}"]`);
        let sum = 0;
        let count = 0;

        rowInputs.forEach(input => {
            if (input.value !== '') {
                sum += parseInt(input.value);
                count++;
            }
        });

        if (count > 0) {
            const avg = (sum / count).toFixed(2);
            promedioCell.textContent = avg;

            promedioCell.classList.remove('grades__promedio--blue', 'grades__promedio--red');
            if (avg >= 12) {
                promedioCell.classList.add('grades__promedio--blue');
            } else {
                promedioCell.classList.add('grades__promedio--red');
            }
        } else {
            promedioCell.textContent = '-';
            promedioCell.classList.remove('grades__promedio--blue', 'grades__promedio--red');
        }
    });
}

function checkFormCompletion() {
    const allInputs = document.querySelectorAll('.js-grade');
    let isComplete = true;

    allInputs.forEach(input => {
        if (input.value === '') {
            isComplete = false;
        }
    });

    if (isComplete) {
        btnSave.disabled = false;
        btnExport.disabled = false;
    } else {
        btnSave.disabled = true;
        btnExport.disabled = true;
    }
}

/* View Toggles */
selectEstudiante.addEventListener('change', (e) => {
    if (e.target.value) {
        emptyState.classList.add('hidden');
        gradesSection.classList.remove('hidden');
        studentAlert.classList.remove('hidden');

        const student = students.find(student => student.EstudianteId === selectEstudiante.value);
        const name = `${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}`;
        studentNameAlert.textContent = name;
        studentNameTitle.textContent = name;

        renderGradesTable();
        checkFormCompletion();
    }
});

// btnClear.addEventListener('click', () => {
//     selectEstudiante.value = "";
//     document.getElementById('selectGrado').value = "";
//     document.getElementById('selectSeccion').value = "";
//     document.querySelector('.filters__input').value = "";

//     emptyState.classList.remove('hidden');
//     gradesSection.classList.add('hidden');
//     studentAlert.classList.add('hidden');

//     btnSave.disabled = true;
//     btnExport.disabled = true;
// });

/* Outro Animation */
btnLogout.addEventListener('click', () => {
    appContainer.classList.add('app--exit');

    setTimeout(() => {
        window.location.href = '/app/admin/dashboard/';
    }, 500);
});