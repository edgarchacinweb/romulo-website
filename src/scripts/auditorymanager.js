import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", async () => {
  const selectGroup = document.querySelectorAll(".select-options");
  const rolSelect = selectGroup.item(0);
  const actionSelect = selectGroup.item(1);
  const dateFromInput = document.getElementById("dateFromInput");
  const dateToInput = document.getElementById("dateToInput");
  const auditoriesTable = document.getElementById("auditoriesTable");
  const reportTable = document.getElementById("report-table");
  const reportDate = document.getElementById("report-date");
  const reportsCount = document.getElementById("report-records-count");
  const btnPdf = document.getElementById("btn-pdf");

  const totalRows = document.getElementById("total-rows");
  const todayActions = document.getElementById("today-actions");
  const totalUsers = document.getElementById("total-users");
  const adminActions = document.getElementById("admin-actions");

  const dateFormat = new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "numeric",
  });

  let records = [];
  let usersCount = 0;
  let currentPage = 1;
  const pageSize = 50;
  let isPaginating = true;

  const loader = document.createElement("loader-spinner");
  const notifications = document.getElementById("notifications");

  const paginationText = document.getElementById("pagination-text");
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");
  const btnViewAll = document.getElementById("btn-view-all");

  const roleTags = {
    administrador: "role-admin",
    docente: "role-docente",
    representante: "role-representante",
  };

  const actionTags = {
    Sesión: "act-login",
    Registro: "act-register",
    Modificación: "act-modify",
    Respaldo: "act-backup",
    Configuración: "act-config",
  };

  // Filtrar registros
  const filter = () => {
    const roleValue = rolSelect
      .querySelector(".selected")
      .getAttribute("data-value");
    const actionValue = actionSelect
      .querySelector(".selected")
      .getAttribute("data-value");
    const dateFromValue = dateFromInput.value;
    const dateToValue = dateToInput.value;

    let filteredRecords = [...records];
    if (roleValue !== "todos")
      filteredRecords = filteredRecords.filter(
        (r) => r["Usuario"]["Rol"] === roleValue,
      );
    if (actionValue !== "todas")
      filteredRecords = filteredRecords.filter(
        (r) => r["Accion"] === actionValue,
      );
    if (dateFromValue.trim() !== "") {
      const dateFrom = new Date(dateFromValue);
      filteredRecords = filteredRecords.filter(
        (r) => new Date(r["Fecha"]) >= dateFrom,
      );
    }
    if (dateToValue.trim() !== "") {
      const dateTo = new Date(dateToValue);
      filteredRecords = filteredRecords.filter(
        (r) => new Date(r["Fecha"]) <= dateTo,
      );
    }

    // Paginación
    const totalFiltered = filteredRecords.length;
    
    // Stats Update (Restore)
    totalRows.textContent = totalFiltered;
    const todayStr = new Date().toISOString().split("T")[0];
    todayActions.textContent = records.filter(
      (r) => r["Fecha"] && String(r["Fecha"]).startsWith(todayStr)
    ).length;
    adminActions.textContent = records.filter(
      (r) => r["Usuario"] && r["Usuario"]["Rol"] === "administrador",
    ).length;

    const totalPages = Math.ceil(totalFiltered / pageSize);

    if (isPaginating) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      
      // Update UI text
      const rangeStart = totalFiltered === 0 ? 0 : start + 1;
      const rangeEnd = Math.min(end, totalFiltered);
      paginationText.textContent = `${rangeStart}-${rangeEnd} de ${totalFiltered.toLocaleString()}`;
      
      // Controls state
      btnPrev.disabled = currentPage <= 1;
      btnNext.disabled = currentPage >= totalPages;
      btnViewAll.textContent = "Ver todo";
      
      filteredRecords = filteredRecords.slice(start, end);
    } else {
      paginationText.textContent = `Mostrando todos (${totalFiltered.toLocaleString()})`;
      btnPrev.disabled = true;
      btnNext.disabled = true;
      btnViewAll.textContent = "Paginar";
    }

    auditoriesTable.innerHTML = "";
    reportTable.innerHTML = "";
    reportDate.textContent = dateFormat.format(new Date());
    reportsCount.textContent = totalFiltered; // El reporte impreso siempre muestra el total filtrado

    filteredRecords.forEach((record) => {
      // Parse ISO Date and Format for presentation
      let formattedDate = record["Fecha"];
      try {
        const d = new Date(record["Fecha"]);
        if (!isNaN(d.getTime())) formattedDate = dateFormat.format(d);
      } catch (e) {}

      const row = document.createElement("tr");
      row.innerHTML = `
			<td>${record["Usuario"]["Email"]}</td>
			<td><span class="pill ${roleTags[record["Usuario"]["Rol"]] || 'role-admin'}">${record["Usuario"]["Rol"]}</span></td>
			<td>${record["Descripcion"]}</td>
			<td>
				<span class="pill ${actionTags[record["Accion"]] || 'act-config'}">${record["Accion"]}</span>
			</td>
			<td>${formattedDate}</td>         
			`;

      auditoriesTable.appendChild(row);

      const report = document.createElement("tr");
      report.innerHTML = `
			<td>${record["Usuario"]["Email"]}</td>
			<td>${record["Usuario"]["Rol"]}</td>
			<td>${record["Descripcion"]}</td>
			<td>${record["Accion"]}</td>
			<td>${formattedDate}</td>
			`;

      reportTable.appendChild(report);
    });
  };

  // 1. Lógica para los Dropdowns Personalizados
  const customSelects = document.querySelectorAll(".custom-select");

  customSelects.forEach((select) => {
    const trigger = select.querySelector(".select-trigger");
    const options = select.querySelectorAll(".select-options li");
    const selectedValueDisplay = select.querySelector(".selected-value");

    // Alternar menú al hacer clic
    trigger.addEventListener("click", (e) => {
      // Cerramos otros selectores abiertos antes de abrir este
      closeAllSelects(select);
      select.classList.toggle("active");
      e.stopPropagation(); // Evita que el click cierre inmediatamente el menú
    });

    // Manejar selección de opciones
    options.forEach((option) => {
      option.addEventListener("click", (e) => {
        // Actualizar texto mostrado
        selectedValueDisplay.textContent = option.textContent;

        // Actualizar clases de selección
        options.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");

        // Cerrar menú
        select.classList.remove("active");
        e.stopPropagation();
      });
    });
  });

  // Cerrar selectores si se hace clic fuera de ellos
  document.addEventListener("click", () => {
    closeAllSelects();
  });

  function closeAllSelects(exceptSelect = null) {
    customSelects.forEach((select) => {
      if (select !== exceptSelect) {
        select.classList.remove("active");
      }
    });
  }

  // 2. Lógica para la Animación de Salida y Redirección
  const btnSalir = document.getElementById("btn-salir");
  const appWrapper = document.getElementById("app-wrapper");

  if (btnSalir && appWrapper) {
    btnSalir.addEventListener("click", (e) => {
      e.preventDefault(); // Prevenir comportamiento por defecto

      // Reemplazar clase de entrada por clase de salida
      appWrapper.classList.remove("fade-in-up");
      appWrapper.classList.add("fade-out-down");

      // Esperar a que termine la animación (500ms definidos en CSS) para redirigir
      setTimeout(() => {
        window.location.href = "/app/admin/dashboard/";
      }, 500);
    });
  }

  // Obteniendo registros
  loader.setAttribute("title", "Cargando Auditorías...");
  document.body.appendChild(loader);
  try {
    const auditoriesPromise = await fetch(
      `${window.APP_CONFIG.api_url}/auditory/filter`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const auditoriesResponse = await auditoriesPromise.json();
    if (!auditoriesPromise.ok) throw new Error(auditoriesResponse.message);
    records = [...auditoriesResponse];

    // Obteniendo cantidad de usuarios activos
    const usersCountPromise = await fetch(
      `${window.APP_CONFIG.api_url}/users/count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const usersCountResponse = await usersCountPromise.json();
    if (!usersCountPromise.ok) throw new Error(usersCountResponse.message);
    usersCount = usersCountResponse["count"];
    totalUsers.textContent = usersCount;
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }

  filter();

  document
    .querySelectorAll(".select-options li")
    .forEach((s) => s.addEventListener("click", filter));
  dateFromInput.addEventListener("change", filter);
  dateToInput.addEventListener("change", filter);

  document.getElementById("reset").addEventListener("click", () => {
    rolSelect.querySelector(".selected").classList.remove("selected");
    rolSelect.querySelector("li").classList.add("selected");
    rolSelect.parentElement.querySelector("span").textContent =
      "Todos los roles";

    actionSelect.querySelector(".selected").classList.remove("selected");
    actionSelect.querySelector("li").classList.add("selected");
    actionSelect.parentElement.querySelector("span").textContent =
      "Todas las acciones";

    dateFromInput.value = "";
    dateToInput.value = "";

    currentPage = 1;
    filter();
  });

  // Eventos de Paginación
  btnPrev.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filter();
    }
  });

  btnNext.addEventListener("click", () => {
    currentPage++;
    filter();
  });

  btnViewAll.addEventListener("click", () => {
    isPaginating = !isPaginating;
    currentPage = 1;
    filter();
  });

  btnPdf.addEventListener("click", () => {
    window.print();
  });
});
