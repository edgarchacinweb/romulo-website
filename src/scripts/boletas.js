// Datos simulados para demostrar el funcionamiento
// Más adelante reemplazarás esto con llamadas a tu backend.
const mockStudents = [
  { id: 'V-31444555', name: 'Alvarado Gómez, Carlos Luis' },
  { id: 'V-32111222', name: 'Bermúdez Rojas, Ana Sofia' },
  { id: 'V-32555666', name: 'Castillo Mendoza, Joxd Daniel' },
  { id: 'V-33777888', name: 'Díaz Silva, María Elena' }
];

// Materias base según el ministerio
const materias = [
  "Castellano", 
  "Inglés", 
  "Matemáticas", 
  "Educación Física", 
  "Arte y Patrimonio", 
  "Ciencias Naturales", 
  "Geografía e Historia"
];

// Habilitar la selección de secciones cuando se elige un grado
window.enableSections = function() {
  document.getElementById('sectionSelect').disabled = false;
};

// Cargar la tabla de estudiantes
window.loadStudents = function() {
  const grade = document.getElementById('gradeSelect');
  const section = document.getElementById('sectionSelect');
  
  if(!grade.value || !section.value) {
    alert("Seleccione Grado y Sección");
    return;
  }

  // Actualizar el "Badge" o etiqueta azul con el curso actual
  document.getElementById('classInfoBadge').innerText = `${grade.options[grade.selectedIndex].text} "${section.value}"`;
  document.getElementById('studentsArea').style.display = 'block';
  
  const tbody = document.getElementById('studentsList');
  tbody.innerHTML = '';

  // Generar filas dinámicamente
  mockStudents.forEach(st => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${st.id}</td>
      <td style="font-weight: 500;">${st.name}</td>
      <td><span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">Regular</span></td>
      <td style="text-align: right;">
        <button class="btn btn-primary" onclick="openBoleta('${st.id}', '${st.name}', '${grade.options[grade.selectedIndex].text}', '${section.value}')">Ver Boleta</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// Función para abrir y llenar la boleta con las calificaciones
window.openBoleta = function(cedula, nombre, grado, seccion) {
  // Llenar datos personales en el encabezado de la boleta
  document.getElementById('bolCed').innerText = cedula;
  document.getElementById('bolName').innerText = nombre;
  document.getElementById('bolYearSec').innerText = `${grado} "${seccion}"`;

  const tbody = document.getElementById('bolGradesBody');
  tbody.innerHTML = '';

  // Simular la carga de notas del backend
  // AQUÍ en el futuro harás: const response = await fetch(`/api/notas/${cedula}`);
  materias.forEach(materia => {
    // Generamos notas aleatorias para la demo (del 08 al 20)
    const n1 = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    const n2 = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    const n3 = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    
    // Faltas aleatorias (0 al 4)
    const f1 = Math.floor(Math.random() * 3);
    const f2 = Math.floor(Math.random() * 3);
    const f3 = Math.floor(Math.random() * 3);

    // Cálculos automáticos de definitivas
    const definitiva = Math.round((n1 + n2 + n3) / 3);
    const totalFaltas = f1 + f2 + f3;

    // Clases CSS para resaltar los promedios bajos (menores a 10)
    const classDef = definitiva < 10 ? 'nota-reprobada' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="subject-col">${materia}</td>
      <td class="${n1 < 10 ? 'nota-reprobada' : ''}">${n1}</td><td>${f1}</td>
      <td class="${n2 < 10 ? 'nota-reprobada' : ''}">${n2}</td><td>${f2}</td>
      <td class="${n3 < 10 ? 'nota-reprobada' : ''}">${n3}</td><td>${f3}</td>
      <td class="${classDef}" style="font-weight: bold; background: #f8fafc; font-size: 0.95rem;">${definitiva}</td>
      <td style="font-weight: bold;">${totalFaltas}</td>
    `;
    tbody.appendChild(tr);
  });

  // Mostrar modal de la boleta
  document.getElementById('boletaModal').classList.add('active');
  document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
};

// Cerrar el modal
window.closeModal = function() {
  document.getElementById('boletaModal').classList.remove('active');
  document.body.style.overflow = 'auto'; // Restaurar el scroll normal
};

// Función Magica para exportar a PDF
window.downloadPDF = function() {
  const element = document.getElementById('printArea');
  const name = document.getElementById('bolName').innerText.replace(/ /g, '_');
  
  // Configuraciones de la librería html2pdf
  const opt = {
    margin:       0,
    filename:     `Boleta_${name}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generar y guardar
  html2pdf().set(opt).from(element).save().then(() => {
      console.log("PDF descargado correctamente.");
  });
};