import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  // Token de autorización
  const token = localStorage.getItem("auth");

  // Elementos
  const loader = document.createElement("loader-spinner");
  const loadNotification = document.createElement("notification-component");
  const loadNotificationContainer = document.getElementById("notifications");
  const registrationEntry = document.getElementById("period-name");
  const tableBody = document.getElementById("table-body");
  const schoolTermBtn = document.getElementById("add-school-term-btn");
  const startDateEntry = document.getElementById("start-date");
  const endDateEntry = document.getElementById("end-date");
  
  let schoolTerms = [];
  let registrationId = null;
  let schoolTermYear = null;
  
  // --- VARIABLES PARA LÍMITES DE FECHAS ---
  let schoolTermEndDateObj = null; 
  let schoolTermMaxDateStr = "";

  // Cargar período escolar
  loader.setAttribute("title", "Cargando Período escolar...");
  document.body.appendChild(loader);
  try {
    const response = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.status === 404) {
      alert("Debes registrar primero un período escolar");
      window.location.href = "/app/admin/dashboard/";
    } else if (response.status !== 200) {
      throw new Error(data.msg);
    }

    registrationId = data.id;
    schoolTermYear = new Date(data["FechaInicio"]).getFullYear();
    registrationEntry.value = `Período ${schoolTermYear} - ${schoolTermYear + 1}`;

    // Limitar calendario (fecha min y max)
    const fechaFinStr = data["FechaFin"];
    schoolTermMaxDateStr = fechaFinStr.split("T")[0];
    
    const [finY, finM, finD] = schoolTermMaxDateStr.split('-');
    schoolTermEndDateObj = new Date(finY, finM - 1, finD);
    schoolTermEndDateObj.setHours(0, 0, 0, 0);

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const hoyStr = `${yyyy}-${mm}-${dd}`;

    startDateEntry.min = hoyStr;
    endDateEntry.min = hoyStr;
    startDateEntry.max = schoolTermMaxDateStr;
    endDateEntry.max = schoolTermMaxDateStr;

    startDateEntry.addEventListener("change", (e) => {
      if (e.target.value) {
        endDateEntry.min = e.target.value;
      } else {
        endDateEntry.min = hoyStr;
      }
    });

  } catch (error) {
    loadNotification.setAttribute("type", "error");
    loadNotification.setAttribute("text", error);
    loadNotificationContainer.appendChild(loadNotification);
  }

  // Obtener todos los períodos de inscripción
  try {
    const response = await fetch(
      `${window.APP_CONFIG.api_url}/registration/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    let data = await response.json();

    if (response.status === 404) {
      data = [];
    } else if (response.status !== 200) {
      throw new Error(data.msg);
    }

    schoolTerms = data;
    data.forEach((e) => {
      const item = document.createElement("tr");
      const schoolTermYear = new Date(
        e["PeriodoEscolar"]["FechaInicio"],
      ).getFullYear();

      item.innerHTML = `
        <td class="font-medium">${schoolTermYear} - ${schoolTermYear + 1}</td>
        <td>${e["Inicio"]}</td>
      `;

      const tdEnd = document.createElement("td");
      tdEnd.textContent = e["Fin"];
      item.appendChild(tdEnd);

      const tdFechaCreacion = document.createElement("td");
      tdFechaCreacion.className = "text-muted";
      tdFechaCreacion.textContent = e["FechaCreacion"];
      item.appendChild(tdFechaCreacion);

      const tdAccion = document.createElement("td");
      const actionContainer = document.createElement("div");
      actionContainer.className = "action-buttons";

      // ================================================================
      // FUNCIÓN COMPARTIDA: renderiza los botones "Editar" y "Cerrar".
      // FIX: Declarada en el scope del forEach (compartido entre los tres
      // casos) para que el botón "Reactivar" del CASO 2 pueda llamarla
      // sin lanzar un ReferenceError que caía al catch como "Error de red".
      // ================================================================
      const renderActiveButtons = () => {
        actionContainer.innerHTML = "";

        // --- BOTÓN EDITAR ---
        const btnEdit = document.createElement("button");
        btnEdit.textContent = "Editar";
        btnEdit.className = "btn-table btn-edit";

        btnEdit.addEventListener("click", () => {
          const originalDate = tdEnd.textContent;

          tdEnd.innerHTML = "";
          const inputDate = document.createElement("input");
          inputDate.type = "date";
          inputDate.className = "inline-date-input";
          inputDate.value = originalDate;

          const hoy = new Date();
          const yyyy = hoy.getFullYear();
          const mm = String(hoy.getMonth() + 1).padStart(2, "0");
          const dd = String(hoy.getDate()).padStart(2, "0");
          inputDate.min = `${yyyy}-${mm}-${dd}`;
          inputDate.max = schoolTermMaxDateStr;

          tdEnd.appendChild(inputDate);

          actionContainer.innerHTML = "";

          const btnSave = document.createElement("button");
          btnSave.textContent = "Guardar";
          btnSave.className = "btn-table btn-save";

          const btnCancel = document.createElement("button");
          btnCancel.textContent = "Cancelar";
          btnCancel.className = "btn-table btn-cancel";

          btnCancel.addEventListener("click", () => {
            tdEnd.textContent = originalDate;
            renderActiveButtons(); // llamada recursiva — ya está en scope
          });

          btnSave.addEventListener("click", async () => {
            const newDate = inputDate.value;
            if (!newDate) {
              alert("Por favor seleccione una fecha");
              return;
            }
            if (newDate < e["Inicio"]) {
              alert("La fecha de fin no puede ser anterior a la de inicio.");
              return;
            }
            try {
              const patchRes = await fetch(
                `${window.APP_CONFIG.api_url}/registration/update`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    PeriodoInscripcionId: e["InscripcionId"],
                    FechaFin: newDate,
                  }),
                }
              );
              if (patchRes.ok) {
                tdEnd.textContent = newDate;
                e["Fin"] = newDate;
                const successNotif = document.createElement("notification-component");
                successNotif.setAttribute("type", "success");
                successNotif.setAttribute("text", "Fecha de fin actualizada correctamente");
                loadNotificationContainer.appendChild(successNotif);
                renderActiveButtons();
              } else {
                const errData = await patchRes.json();
                alert("Error al actualizar: " + (errData.message || "Error desconocido"));
              }
            } catch (err) {
              alert("Error de conexión al guardar.");
            }
          });

          actionContainer.appendChild(btnSave);
          actionContainer.appendChild(btnCancel);
        });

        // --- BOTÓN CERRAR ---
        const btnCerrar = document.createElement("button");
        btnCerrar.textContent = "Cerrar";
        btnCerrar.className = "btn-table btn-close-term";

        btnCerrar.addEventListener("click", async () => {
          if (!confirm("¿Estás seguro de que deseas cerrar este período de inscripción prematuramente?")) return;

          try {
            const res = await fetch(
              `${window.APP_CONFIG.api_url}/registration/close/${e["InscripcionId"]}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (res.ok) {
              e["Activo"] = false;
              // Mostrar botón Reactivar con handler completo
              actionContainer.innerHTML = "";
              renderReactivateButton();
            } else {
              const errData = await res.json();
              alert("Error: " + (errData.message || "No se pudo cerrar el período."));
            }
          } catch (err) {
            alert("Error de conexión con el servidor.");
          }
        });

        actionContainer.appendChild(btnEdit);
        actionContainer.appendChild(btnCerrar);
      }; // fin renderActiveButtons

      // ================================================================
      // FUNCIÓN COMPARTIDA: renderiza el botón "Reactivar" con su handler.
      // También declarada en el scope del forEach para reutilización.
      // ================================================================
      const renderReactivateButton = () => {
        actionContainer.innerHTML = "";

        const btnReactivar = document.createElement("button");
        btnReactivar.textContent = "Reactivar";
        btnReactivar.className = "btn-table btn-reactivate";
        btnReactivar.title = "El período fue cerrado antes de su fecha de fin. Puede reactivarse.";

        btnReactivar.addEventListener("click", async () => {
          if (!confirm("¿Deseas reactivar este período de inscripción?")) return;

          btnReactivar.disabled = true;
          btnReactivar.textContent = "Reactivando...";

          try {
            const res = await fetch(
              `${window.APP_CONFIG.api_url}/registration/reactivate/${e["InscripcionId"]}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // Leer JSON de la respuesta (presente tanto en éxito como en error)
            let resData = {};
            try { resData = await res.json(); } catch (_) { /* respuesta sin body */ }

            if (res.ok) {
              // ✅ Actualizar objeto local y redibujar botones Editar/Cerrar sin recargar
              e["Activo"] = true;
              renderActiveButtons();

              const successNotif = document.createElement("notification-component");
              successNotif.setAttribute("type", "success");
              successNotif.setAttribute("text", resData.message || "Período reactivado correctamente");
              loadNotificationContainer.appendChild(successNotif);
            } else {
              // Error semántico del servidor (403, 404, 409…) — petición llegó, servidor respondió
              btnReactivar.disabled = false;
              btnReactivar.textContent = "Reactivar";
              const errNotif = document.createElement("notification-component");
              errNotif.setAttribute("type", "error");
              errNotif.setAttribute("text", resData.message || "No se pudo reactivar el período.");
              loadNotificationContainer.appendChild(errNotif);
            }
          } catch (err) {
            // Solo llega aquí con error REAL de red (servidor caído, sin conexión)
            btnReactivar.disabled = false;
            btnReactivar.textContent = "Reactivar";
            const errNotif = document.createElement("notification-component");
            errNotif.setAttribute("type", "error");
            errNotif.setAttribute("text", "Error de red: no se pudo comunicar con el servidor.");
            loadNotificationContainer.appendChild(errNotif);
            console.error("[Reactivar] Network error:", err);
          }
        });

        actionContainer.appendChild(btnReactivar);
      }; // fin renderReactivateButton

      // ============================================================
      // LÓGICA CONDICIONAL DE ACCIONES SEGÚN ESTADO DEL PERÍODO
      // ============================================================
      if (e["EsDefinitivamenteCerrado"]) {
        // CASO 1: Fecha de Fin vencida — cierre definitivo e irreversible
        tdAccion.innerHTML = `
          <span class="badge-closed-definitive" title="La Fecha de Fin ya venció. Este período no puede reactivarse.">
            🔒 Inactivo/Cerrado
          </span>`;

      } else if (!e["Activo"]) {
        // CASO 2: Cerrado manualmente, Fecha de Fin aún vigente → "Reactivar"
        renderReactivateButton();
        tdAccion.appendChild(actionContainer);

      } else {
        // CASO 3: Período activo → "Editar" y "Cerrar"
        renderActiveButtons();
        tdAccion.appendChild(actionContainer);
      }

      item.appendChild(tdAccion);
      tableBody.appendChild(item);
    });
  } catch (error) {
    console.log(error);
  }

  loader.remove();

  // Agregar un nuevo período de inscripción
  schoolTermBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const notification = document.createElement("notification-component");
    try {
      const startDate = startDateEntry.value;
      const endDate = endDateEntry.value;

      if (!startDate || !endDate) {
        throw new Error("Debes rellenar ambos campos primero");
      }

      const [startYear, startMonth, startDay] = startDate.split('-');
      const startEntryDate = new Date(startYear, startMonth - 1, startDay);
      startEntryDate.setHours(0, 0, 0, 0);

      const [endYear, endMonth, endDay] = endDate.split('-');
      const endEntryDate = new Date(endYear, endMonth - 1, endDay);
      endEntryDate.setHours(0, 0, 0, 0);

      const hoyParaValidar = new Date();
      hoyParaValidar.setHours(0, 0, 0, 0);

      if (startEntryDate < hoyParaValidar) {
        throw new Error("La fecha de inicio no puede ser anterior al día de hoy.");
      }

      if (endEntryDate > schoolTermEndDateObj) {
        const [y, m, d] = schoolTermMaxDateStr.split("-");
        throw new Error(`La fecha de fin no puede exceder el límite del período escolar (${d}/${m}/${y}).`);
      }

      if (startEntryDate > endEntryDate) {
        throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
      }

      const hasOverlap = schoolTerms.some((term) => {
        const tStart = term["Inicio"].split("T")[0];
        const tEnd = term["Fin"].split("T")[0];
        return tStart <= endDate && tEnd >= startDate;
      });

      if (hasOverlap) {
        throw new Error(
          "Las fechas seleccionadas chocan con un periodo de inscripción existente.",
        );
      }

      const response = await fetch(
        `${window.APP_CONFIG.api_url}/registration/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            FechaInicio: startDate,
            FechaFin: endDate,
          }),
        },
      );

      const data = await response.json();

      if (response.status !== 201) throw new Error(data);

      const dateFormat = Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "numeric",
      });

      const registrationElement = document.createElement("tr");
      registrationElement.innerHTML = `
                <td class="font-medium">${schoolTermYear} - ${
                  schoolTermYear + 1
                }</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td class="text-muted">${dateFormat.format(new Date())}</td>
      `;

      const tdAccion = document.createElement("td");
      tdAccion.className = "action-buttons";

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Editar";
      btnEdit.className = "btn-table btn-edit";
      btnEdit.addEventListener("click", () => {
          window.location.reload();
      });

      const btnCerrar = document.createElement("button");
      btnCerrar.textContent = "Cerrar";
      btnCerrar.className = "btn-table btn-close-term";
      btnCerrar.addEventListener("click", async () => {
        if (confirm("¿Estás seguro de que deseas cerrar este período de inscripción prematuramente?")) {
          try {
            const res = await fetch(`${window.APP_CONFIG.api_url}/registration/close/${data.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            });
            if (res.ok) {
              tdAccion.innerHTML = '<span style="color:red; font-weight:bold;">Inactivo/Cerrado</span>';
            } else {
              alert("Error al intentar cerrar el período.");
            }
          } catch (err) {
            alert("Error de conexión con el servidor.");
          }
        }
      });
      
      tdAccion.appendChild(btnEdit);
      tdAccion.appendChild(btnCerrar);
      registrationElement.appendChild(tdAccion);

      const beforeElement = document.querySelector("tbody tr");
      console.log(beforeElement);
      if (beforeElement)
        tableBody.insertBefore(registrationElement, beforeElement);
      else tableBody.appendChild(registrationElement);

      startDateEntry.value = "";
      endDateEntry.value = "";

      notification.setAttribute("type", "success");
      notification.setAttribute(
        "text",
        "Período de inscripción definido correctamente",
      );
    } catch (error) {
      notification.setAttribute("type", "error");
      notification.setAttribute("text", error.message || error);
    } finally {
      loadNotificationContainer.appendChild(notification);
    }
  });
});

document.getElementById("BtnBack").addEventListener("click", (event) => {
  event.preventDefault();
  document.body.style.animation = "goodByePage 0.8s forwards";
  setTimeout(() => (window.location.href = event.target.href), 1000);
});