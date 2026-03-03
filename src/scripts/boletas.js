import authorize from "./auth.js";

// Verificamos permisos (Asumimos que esto lo maneja el admin)
authorize("administrador");

const token = localStorage.getItem("auth");
const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

// Elementos del DOM
const cursoSelect = document.getElementById("cursoSelect");
const studentsArea = document.getElementById("studentsArea");
const studentsList = document.getElementById("studentsList");
const classInfoBadge = document.getElementById("classInfoBadge");

// Variables globales para almacenar la data obtenida
let currentStudentsData = []; // Guardará el resultado del endpoint de asistencias
let allSubjects = []; // Lista maestra de materias
window.currentBoletaContext = null; // Para poder recargar la boleta después de editar

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Cargar la lista de Cursos (Grados y Secciones)
    try {
        const cursosRes = await fetch(`${apiUrl}/course/sections`, { headers: { "Authorization": `Bearer ${token}` } });
        if (cursosRes.ok) {
            const cursos = await cursosRes.json();
            cursoSelect.innerHTML = '<option value="" disabled selected>Seleccione un Curso y Sección</option>';
            
            cursos.forEach(c => {
                const numSections = parseInt(c.Seccion) || 1;
                for (let i = 1; i <= numSections; i++) {
                    const opt = document.createElement("option");
                    opt.value = c.CursoId;
                    opt.dataset.section = i;
                    opt.dataset.gradeNum = c.Grado; // Importante para pedir las notas luego
                    
                    const gradoTexto = { 1: "1er", 2: "2do", 3: "3er", 4: "4to", 5: "5to" }[c.Grado] || `${c.Grado}°`;
                    const seccionLetra = String.fromCharCode(64 + i);
                    opt.textContent = `${gradoTexto} Año - Sección ${seccionLetra}`;
                    cursoSelect.appendChild(opt);
                }
            });
        }

        // 2. Cargar lista maestra de materias
        const materiasRes = await fetch(`${apiUrl}/subject/list`, { headers: { "Authorization": `Bearer ${token}` } });
        if (materiasRes.ok) {
            allSubjects = await materiasRes.json();
        }

    } catch (error) {
        console.error("Error inicializando vista:", error);
    }
});

// Función para cargar los estudiantes al hacer clic en "Buscar"
window.loadStudents = async function() {
    const selectedOption = cursoSelect.options[cursoSelect.selectedIndex];
    
    if(!cursoSelect.value || selectedOption.disabled) {
        alert("Por favor, seleccione un Curso y Sección válido.");
        return;
    }

    const cursoId = cursoSelect.value;
    const seccionNum = selectedOption.dataset.section;
    const cursoTexto = selectedOption.textContent;

    classInfoBadge.innerText = cursoTexto;
    studentsList.innerHTML = `<tr><td colspan="4" style="text-align:center;">Cargando estudiantes...</td></tr>`;
    studentsArea.style.display = 'block';

    try {
        // Usamos la genial ruta del admin de asistencia consolidada para traer todos los alumnos y sus inasistencias de una vez
        const queryParams = new URLSearchParams({ cursoId: cursoId, seccion: seccionNum });
        const response = await fetch(`${apiUrl}/assistance/admin/report_lapso?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentStudentsData = data.reporte_lapsos || [];

            if (currentStudentsData.length === 0) {
                studentsList.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #64748b;">No hay estudiantes inscritos o con registros en este curso.</td></tr>`;
                return;
            }

            renderStudentsTable(currentStudentsData, cursoTexto, selectedOption.dataset.gradeNum);
        } else {
            const error = await response.json();
            alert(`Error obteniendo estudiantes: ${error.message}`);
        }
    } catch (error) {
        console.error("Error al buscar:", error);
        alert("Error de conexión al cargar la lista.");
    }
};

// Renderizar la tabla inicial
function renderStudentsTable(students, cursoTexto, gradeNum) {
    studentsList.innerHTML = '';

    students.forEach((st, index) => {
        // Calcular inasistencias globales para un resumen rápido
        let totalFaltasGlobales = 0;
        if(st.Materias) {
            Object.values(st.Materias).forEach(lapsos => {
                totalFaltasGlobales += (lapsos["1"]?.I || 0) + (lapsos["2"]?.I || 0) + (lapsos["3"]?.I || 0);
            });
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <!-- AHORA USAMOS LA CÉDULA REAL OBTENIDA DEL BACKEND -->
            <td style="font-weight: bold; color: #475569;">${st.Cedula || "Sin Registro"}</td> 
            <td style="font-weight: 500;">${st.NombreEstudiante}</td>
            <td style="text-align: center;">
                <span style="background: ${totalFaltasGlobales > 10 ? '#fee2e2' : '#f1f5f9'}; color: ${totalFaltasGlobales > 10 ? '#991b1b' : '#475569'}; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">
                    ${totalFaltasGlobales} faltas registradas
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn btn-primary" onclick="openBoleta(${index}, '${cursoTexto}', ${gradeNum})">
                    Ver Boleta
                </button>
            </td>
        `;
        studentsList.appendChild(tr);
    });
}

// Función principal: Combinar Faltas (ya cargadas) con Calificaciones (petición nueva)
window.openBoleta = async function(studentIndex, cursoTexto, gradeNum) {
    // Guardamos el contexto por si necesitamos recargar la boleta al editar una nota
    window.currentBoletaContext = { studentIndex, cursoTexto, gradeNum };

    const student = currentStudentsData[studentIndex];
    
    // Llenar Encabezado de la Boleta con CÉDULA REAL
    document.getElementById('bolCed').innerText = student.Cedula || "Sin Registro"; 
    document.getElementById('bolName').innerText = student.NombreEstudiante;
    document.getElementById('bolYearSec').innerText = cursoTexto;

    const tbody = document.getElementById('bolGradesBody');
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Cargando calificaciones...</td></tr>`;
    
    // Mostrar modal con un loader de texto
    document.getElementById('boletaModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        // Buscar calificaciones del estudiante
        const gradesRes = await fetch(`${apiUrl}/calification/list/by_student?Grado=${gradeNum}&EstudianteId=${student.EstudianteId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        let calificaciones = [];
        if (gradesRes.ok) {
            calificaciones = await gradesRes.json();
        }

        tbody.innerHTML = ''; // Limpiamos el cargando

        // Vamos a cruzar todas las materias que tenga registradas (ya sea que tengan faltas o notas)
        const materiasProcesadas = new Set();
        
        // 1. Extraemos los nombres de las materias desde el consolidado de inasistencias
        const materiasConFaltas = Object.keys(student.Materias || {});
        materiasConFaltas.forEach(m => materiasProcesadas.add(m));

        // 2. Extraemos las materias desde las calificaciones (por si un profesor subió nota pero no tomó asistencia)
        calificaciones.forEach(c => {
            // El modelo de Nota retorna la Materia anidada, intentamos sacar el nombre
            const nombreMat = c.Materia?.Nombre || c.Materia_Nombre || "Materia Desconocida";
            materiasProcesadas.add(nombreMat);
        });

        // Helper para crear celdas de notas interactivas (Edición Admin)
        const buildNotaCell = (notaObj, lapso, nVal) => {
            if (nVal === "--") {
                // Si la nota no ha sido creada por el docente, no permitimos editarla por aquí
                return `<td style="color: #94a3b8;" title="Esta nota aún no ha sido cargada por el docente">--</td>`;
            }
            
            const classRep = nVal < 10 ? 'nota-reprobada' : '';
            const notaId = notaObj.id || notaObj.NotaId;
            const matId = notaObj.Materia?.id || notaObj.MateriaId;
            const bolId = notaObj.Boleta?.id || notaObj.BoletaId;

            // Retornamos una celda que reacciona al Doble Clic
            return `<td class="${classRep}" 
                        ondblclick="makeEditable(this, '${notaId}', '${matId}', '${bolId}', ${lapso}, ${nVal})"
                        title="Doble clic para corregir calificación"
                        style="cursor: pointer; position: relative; transition: background 0.2s;"
                        onmouseover="this.style.backgroundColor='#e0f2fe'"
                        onmouseout="this.style.backgroundColor='transparent'">
                        ${nVal}
                    </td>`;
        };

        // 3. Renderizamos cada materia en la tabla de la boleta
        materiasProcesadas.forEach(nombreMateria => {
            // Faltas (Si no hay registro, asumimos 0)
            const faltas = (student.Materias && student.Materias[nombreMateria]) ? student.Materias[nombreMateria] : { 
                "1": { I: 0 }, "2": { I: 0 }, "3": { I: 0 } 
            };

            const f1 = faltas["1"]?.I || 0;
            const f2 = faltas["2"]?.I || 0;
            const f3 = faltas["3"]?.I || 0;
            const totalFaltas = f1 + f2 + f3;

            // Notas (Buscamos la nota por cada lapso para esta materia)
            // Aseguramos que el nombre coincida o ignoramos case sensitive
            const getNotaObj = (lapso) => {
                return calificaciones.find(c => {
                    const matName = c.Materia?.Nombre || c.Materia_Nombre || "";
                    return matName.toLowerCase() === nombreMateria.toLowerCase() && parseInt(c.Lapso) === lapso;
                });
            };

            const notaObj1 = getNotaObj(1);
            const notaObj2 = getNotaObj(2);
            const notaObj3 = getNotaObj(3);

            const n1 = notaObj1 ? notaObj1.Ponderacion : "--";
            const n2 = notaObj2 ? notaObj2.Ponderacion : "--";
            const n3 = notaObj3 ? notaObj3.Ponderacion : "--";

            // Calcular definitiva (solo si hay números)
            let sum = 0, count = 0;
            [n1, n2, n3].forEach(n => { if (n !== "--") { sum += parseFloat(n); count++; } });
            
            let definitiva = count > 0 ? Math.round(sum / count) : "--";

            // Estilos de reprobado
            const classDef = (definitiva !== "--" && definitiva < 10) ? 'nota-reprobada' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="subject-col">${nombreMateria}</td>
              ${buildNotaCell(notaObj1, 1, n1)} <td>${f1}</td>
              ${buildNotaCell(notaObj2, 2, n2)} <td>${f2}</td>
              ${buildNotaCell(notaObj3, 3, n3)} <td>${f3}</td>
              <td class="${classDef}" style="font-weight: bold; background: #f8fafc; font-size: 0.95rem;">${definitiva}</td>
              <td style="font-weight: bold; color: ${totalFaltas > 5 ? '#ef4444' : 'inherit'}">${totalFaltas}</td>
            `;
            tbody.appendChild(tr);
        });

        if(materiasProcesadas.size === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#64748b;">No hay datos registrados para este estudiante.</td></tr>`;
        }

    } catch (error) {
        console.error("Error cargando detalles de boleta:", error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Error conectando con el servidor para traer las calificaciones.</td></tr>`;
    }
};

// === NUEVA FUNCIÓN PARA EDICIÓN DE NOTAS POR PARTE DEL ADMIN ===
window.makeEditable = function(td, notaId, materiaId, boletaId, lapso, oldVal) {
    if(td.querySelector('input')) return; // Ya está editándose

    // Convertimos la celda en un Input
    td.innerHTML = `<input type="number" value="${oldVal}" min="1" max="20" style="width: 50px; text-align: center; border: 2px solid #3b82f6; border-radius: 4px; padding: 2px; outline: none; font-weight: bold; font-size: 0.9rem;" />`;
    
    const input = td.querySelector('input');
    input.focus();
    input.select();

    // Lógica para guardar
    const saveGrade = async () => {
        let newVal = parseInt(input.value);
        
        // Validación de la nota
        if(isNaN(newVal) || newVal < 1 || newVal > 20) {
            td.innerHTML = oldVal;
            return;
        }
        if(newVal === oldVal) {
            td.innerHTML = oldVal;
            return;
        }

        // Mostrar Feedback visual
        td.innerHTML = `<span style="font-size:0.75rem; color:#64748b;">⏳...</span>`;

        try {
            const body = {
                Ponderacion: newVal,
                Lapso: parseInt(lapso),
                MateriaId: materiaId,
                BoletaId: boletaId
            };

            // Mandamos la actualización a la BD
            const res = await fetch(`${apiUrl}/calification/update/${notaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            if(res.ok) {
                // Si guardó, recargamos la boleta para que actualice la "Definitiva" automáticamente
                const ctx = window.currentBoletaContext;
                window.openBoleta(ctx.studentIndex, ctx.cursoTexto, ctx.gradeNum);
            } else {
                const error = await res.json();
                alert(`Error al guardar: ${error.message || 'Desconocido'}`);
                td.innerHTML = oldVal;
            }
        } catch(e) {
            alert('Error de conexión al intentar guardar la nota.');
            td.innerHTML = oldVal;
        }
    };

    // Guardar al perder el foco o presionar Enter
    input.addEventListener('blur', saveGrade);
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') input.blur();
        if(e.key === 'Escape') {
            // Cancelar edición
            td.innerHTML = oldVal;
        }
    });
};

window.closeModal = function() {
  document.getElementById('boletaModal').classList.remove('active');
  document.body.style.overflow = 'auto';
};

window.downloadPDF = function() {
  const element = document.getElementById('printArea');
  const name = document.getElementById('bolName').innerText.replace(/ /g, '_');
  
  const opt = {
    margin:       0,
    filename:     `Boleta_${name}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};