import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // --- Lógica de Acordeones ---
  const accordions = document.querySelectorAll(".accordion");

  accordions.forEach((acc) => {
    const header = acc.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      // Toggle de la clase active
      acc.classList.toggle("active");
    });
  });

  // --- Lógica del Modal de Rechazo ---
  const modal = document.getElementById("rejectModal");
  const btnRejectList = document.querySelectorAll(".btn-reject");
  const btnCancel = document.getElementById("cancelReject");
  const btnConfirm = document.getElementById("confirmReject");

  // Elementos del formulario y preview
  const selectReason = document.getElementById("rejectReason");
  const textDesc = document.getElementById("rejectDesc");
  const previewReasonBox = document.getElementById("previewReasonBox");
  const previewReasonText = document.getElementById("previewReasonText");
  const previewDescText = document.getElementById("previewDescText");
  const modalStudentName = document.getElementById("modalStudentName");
  const previewStudent = document.getElementById("previewStudent");

  // Abrir Modal
  btnRejectList.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const studentName = e.currentTarget.getAttribute("data-student");

      // Setear datos
      modalStudentName.textContent = studentName;
      previewStudent.textContent = studentName;

      // Limpiar form
      selectReason.selectedIndex = 0;
      textDesc.value = "";
      updatePreview();

      // Mostrar modal
      modal.classList.add("open");
    });
  });

  // Cerrar Modal
  const closeModal = () => modal.classList.remove("open");
  btnCancel.addEventListener("click", closeModal);

  // Cerrar al hacer click fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Actualización en Vivo del Preview ---

  function updatePreview() {
    // Actualizar Motivo
    const reason = selectReason.value;
    if (reason) {
      previewReasonBox.style.display = "block";
      previewReasonText.textContent = reason;
    } else {
      previewReasonBox.style.display = "none";
    }

    // Actualizar Descripción
    const desc = textDesc.value;
    if (desc) {
      previewDescText.textContent = `"${desc}"`;
      previewDescText.style.display = "block";
    } else {
      previewDescText.style.display = "none";
    }
  }

  selectReason.addEventListener("change", updatePreview);
  textDesc.addEventListener("input", updatePreview);

  // Acción de Confirmar (Simulada)
  btnConfirm.addEventListener("click", () => {
    if (textDesc.value.length < 10) {
      alert(
        "Por favor ingresa una descripción detallada (mínimo 10 caracteres).",
      );
      return;
    }

    // Simulación de envío
    const originalText = btnConfirm.textContent;
    btnConfirm.textContent = "Enviando...";
    btnConfirm.disabled = true;

    setTimeout(() => {
      alert("Correo de rechazo enviado exitosamente.");
      closeModal();
      btnConfirm.textContent = originalText;
      btnConfirm.disabled = false;
    }, 1000);
  });

  document.getElementById("BtnBack").addEventListener("click", () => {
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = "/app/admin/dashboard/"), 1000);
  });
});
