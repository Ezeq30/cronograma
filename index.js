document.addEventListener('DOMContentLoaded', () => {
  const empleados = [
    { nombre: 'Raúl Martínez', legajo: 6867, color: '#ef4444' },
    { nombre: 'Gonzalo Alcaraz', legajo: 7287, color: '#f59e0b' },
    { nombre: 'Ezequiel Díaz', legajo: 7701, color: '#10b981' },
    { nombre: 'Mariel Nieva', legajo: 7022, color: '#3b82f6' }
  ];

  let mesActual = new Date().getMonth() + 1;
  let añoActual = new Date().getFullYear();
  let currentTab = 'semana';
  let cronograma = {};

  document.getElementById('btnEntrar').addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (user === 'eze' && pass === 'computos') {
      document.getElementById('login').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      init();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });

  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnEntrar').click();
  });

  document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnEntrar').click();
  });

  document.querySelector('.logout').addEventListener('click', () => {
    location.reload();
  });

  document.querySelector('.pdf').addEventListener('click', generarPDF);

  document.querySelectorAll('.tab').forEach((tab, idx) => {
    tab.addEventListener('click', () => cambiarTab(idx === 0 ? 'semana' : 'mes'));
  });

  window.agregarChecks = agregarChecks;
  window.eliminar = eliminar;

  async function init() {
    console.log('init() llamado');
    await cargarDatos();
    renderLegend();
    generarSelectores();
    renderCalendars();
    console.log('Antes de setupMonthKeyboardNav');
    setupMonthKeyboardNav();
    console.log('Antes de setupWeekKeyboardNav');
    setupWeekKeyboardNav();
    console.log('Fin de init()');
  }

  async function cargarDatos() {
    const local = localStorage.getItem('cronograma');
    if (local) {
      cronograma = JSON.parse(local);
      renderCalendars();
    }
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        cronograma = data || {};
        localStorage.setItem('cronograma', JSON.stringify(cronograma));
        renderCalendars();
      }
    } catch (e) {
      console.log('Offline mode: using localStorage');
    }
  }

  async function guardarCronograma() {
    localStorage.setItem('cronograma', JSON.stringify(cronograma));
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cronograma)
      });
    } catch (e) {
      console.log('Could not sync to server');
    }
  }

  function getAssignmentColor(asignacion, emp) {
    if (asignacion.tipo === 'feriado') return 'rgba(59, 130, 246, 0.65)';
    if (asignacion.tipo === 'feriado-franco') return 'rgba(244, 114, 182, 0.55)';
    if (asignacion.tipo === 'compensatorio') return 'rgba(251, 191, 36, 0.6)';
    return emp ? emp.color + '60' : 'rgba(79,70,229,0.4)';
  }

  function getTipoTag(asignacion) {
    if (asignacion.tipo === 'feriado') return ' FT';
    if (asignacion.tipo === 'feriado-franco') return ' FF';
    if (asignacion.tipo === 'compensatorio') return ' C';
    return '';
  }

  function renderLegend() {
    document.getElementById('legend').innerHTML = empleados.map(e =>
      `<div class="legend-item">
        <div class="legend-color" style="background:${e.color}"></div>
        <span>${e.nombre} (${e.legajo})</span>
      </div>`
    ).join('');
  }

  function generarSelectores() {
    const mesSelect = document.getElementById('mesSelect');
    const añoSelect = document.getElementById('añoSelect');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    meses.forEach((m, i) => {
      const opt = document.createElement('option');
      opt.value = i + 1;
      opt.textContent = m;
      mesSelect.appendChild(opt);
    });

    for (let a = 2024; a <= 2030; a++) {
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = a;
      añoSelect.appendChild(opt);
    }

    mesSelect.value = mesActual;
    añoSelect.value = añoActual;

    mesSelect.addEventListener('change', () => { mesActual = parseInt(mesSelect.value); renderCalendars(); });
    añoSelect.addEventListener('change', () => { añoActual = parseInt(añoSelect.value); renderCalendars(); });
  }

  function renderCalendars() {
    renderSemana();
    renderMes();
  }

  function renderSemana() {
    const container = document.getElementById('view-semana');
    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let html = '<div class="calendar-week">';

    dias.forEach((dia, i) => {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      const esHoy = fecha.toDateString() === ahora.toDateString();
      const asignados = cronograma[fechaStr] || [];

      html += `<div class="day-card ${esHoy ? 'today' : ''}" tabindex="0">
        <div class="day-name">${dia}</div>
        <div class="day-number">${fecha.getDate()}</div>
        <div class="assignments">
          ${asignados.map(a => {
            const emp = empleados.find(e => e.legajo === a.legajo);
            return `<div class="assignment" style="background: ${getAssignmentColor(a, emp)}">
              <span>${a.nombre.split(' ')[0]}${getTipoTag(a)}</span>
              <button class="remove" onclick="eliminar('${fechaStr}', ${a.legajo})">&times;</button>
            </div>`;
          }).join('')}
        </div>
        <div class="add-assignment">
          <select class="tipo-select" data-fecha="${fechaStr}">
            <option value="normal">Normal</option>
            <option value="feriado">Feriado Trabajado</option>
            <option value="feriado-franco">Feriado Franco</option>
            <option value="compensatorio">Franco Compensatorio</option>
          </select>
          <div class="check-group">
            ${empleados.map(e =>
              `<label class="check-label">
                <input type="checkbox" value='${JSON.stringify(e)}' data-fecha="${fechaStr}">
                <span>${e.nombre.split(' ')[0]}</span>
              </label>`
            ).join('')}
          </div>
          <button onclick="agregarChecks('${fechaStr}')">Agregar</button>
        </div>
      </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function renderMes() {
    const container = document.getElementById('view-mes');
    const primerDia = new Date(añoActual, mesActual - 1, 1).getDay();
    const diasEnMes = new Date(añoActual, mesActual, 0).getDate();
    const ahora = new Date();

    let html = '<div class="calendar-month">';
    html += '<div class="month-header">';
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
      html += `<div class="month-header-day">${d}</div>`;
    });
    html += '</div>';
    html += '<div class="month-days">';

    const offset = primerDia === 0 ? 6 : primerDia - 1;
    for (let i = 0; i < offset; i++) {
      html += '<div class="month-day other-month"></div>';
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(añoActual, mesActual - 1, dia);
      const fechaStr = `${añoActual}-${String(mesActual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const esHoy = fecha.toDateString() === ahora.toDateString();
      const asignados = cronograma[fechaStr] || [];

      html += `<div class="month-day ${esHoy ? 'today' : ''}" tabindex="0">
        <div class="day-num">${dia}</div>
        <div class="day-assignments">
          ${asignados.map(a => {
            const emp = empleados.find(e => e.legajo === a.legajo);
            return `<div class="mini-assign" style="background: ${getAssignmentColor(a, emp)}">
              <span>${a.nombre.split(' ')[0]}${getTipoTag(a)}</span>
              <span class="rm" onclick="eliminar('${fechaStr}', ${a.legajo})">&times;</span>
            </div>`;
          }).join('')}
        </div>
        <div class="month-add">
          <select class="tipo-select-mes" tabindex="-1">
            <option value="normal">Normal</option>
            <option value="feriado">F.Trab.</option>
            <option value="feriado-franco">F.Fran.</option>
            <option value="compensatorio">Comp.</option>
          </select>
          <div class="emp-select-mes" data-fecha="${fechaStr}">+</div>
        </div>
      </div>`;
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  let empDropdown = null;

  function focusSiblingDay(day, direction) {
    const all = document.querySelectorAll('.month-day:not(.other-month)');
    const idx = Array.from(all).indexOf(day);
    const next = idx + direction;
    if (next >= 0 && next < all.length) {
      all[next].focus();
    }
  }

  function getEmpOptions() {
    return empleados.map(e => ({
      empleado: e,
      label: e.nombre.split(' ')[0],
      filterKey: e.nombre.split(' ')[0].toLowerCase()
    }));
  }

  function openEmpDropdown(day, filterChar) {
    closeEmpDropdown();
    const empSel = day.querySelector('.emp-select-mes');
    if (!empSel) return;
    const fechaStr = empSel.dataset.fecha;
    if (!fechaStr) return;

    const options = getEmpOptions();
    let filtered = options;
    if (filterChar) {
      filtered = options.filter(o => o.filterKey.startsWith(filterChar));
    }
    if (filtered.length === 0) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-emp-dropdown';
    const monthAdd = day.querySelector('.month-add');
    if (!monthAdd) return;
    monthAdd.appendChild(dropdown);

    const selectedIdx = filterChar ? 0 : -1;
    empDropdown = { el: dropdown, dayEl: day, fechaStr, filtered, selectedIdx };
    renderDropdownItems();
  }

  function renderDropdownItems() {
    if (!empDropdown || !empDropdown.el) return;
    empDropdown.el.innerHTML = '';
    empDropdown.filtered.forEach((opt, i) => {
      const item = document.createElement('div');
      item.className = 'custom-emp-item' + (i === empDropdown.selectedIdx ? ' selected' : '');
      item.textContent = opt.label;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectEmpFromDropdown(opt.empleado);
      });
      empDropdown.el.appendChild(item);
    });
  }

  function confirmEmpSelection() {
    if (!empDropdown || empDropdown.selectedIdx < 0) return;
    selectEmpFromDropdown(empDropdown.filtered[empDropdown.selectedIdx].empleado);
  }

  function closeEmpDropdown() {
    if (empDropdown && empDropdown.el) {
      empDropdown.el.remove();
    }
    empDropdown = null;
  }

  function selectEmpFromDropdown(emp) {
    if (!empDropdown) return;
    const dayEl = empDropdown.dayEl;
    const fechaStr = empDropdown.fechaStr;
    const tipoSel = dayEl.querySelector('.tipo-select-mes');
    const tipo = tipoSel ? tipoSel.value : 'normal';

    if (!cronograma[fechaStr]) cronograma[fechaStr] = [];
    const exists = cronograma[fechaStr].some(e => e.legajo === emp.legajo);
    if (!exists) {
      cronograma[fechaStr].push({ ...emp, tipo });
    }
    tipoSel.value = 'normal';

    const partes = fechaStr.split('-').map(Number);
    const nextDate = new Date(partes[0], partes[1] - 1, partes[2]);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextFechaStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

    closeEmpDropdown();
    guardarCronograma();
    renderCalendars();

    const nextDay = findMonthDayByFecha(nextFechaStr);
    if (nextDay) {
      nextDay.focus();
    } else {
      const currDay = findMonthDayByFecha(fechaStr);
      if (currDay) currDay.focus();
    }
  }

  function findMonthDayByFecha(fechaStr) {
    const all = document.querySelectorAll('.month-day:not(.other-month)');
    return Array.from(all).find(day => {
      const es = day.querySelector('.emp-select-mes');
      return es && es.dataset.fecha === fechaStr;
    });
  }

  function setupMonthKeyboardNav() {
    const container = document.getElementById('view-mes');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const plusBtn = e.target.closest('.emp-select-mes');
      if (plusBtn) {
        const day = plusBtn.closest('.month-day');
        if (day && !day.classList.contains('other-month')) {
          day.focus();
          openEmpDropdown(day);
        }
        return;
      }

      const tipoSelect = e.target.closest('.tipo-select-mes');
      if (tipoSelect) {
        const day = tipoSelect.closest('.month-day');
        if (day) day.focus();
        return;
      }

      const day = e.target.closest('.month-day');
      if (!day || day.classList.contains('other-month')) return;
      if (e.target.closest('.rm')) return;
      if (e.target.closest('.custom-emp-dropdown')) return;

      day.focus();
    });

    container.addEventListener('change', (e) => {
      if (e.target.matches('.tipo-select-mes')) {
        const day = e.target.closest('.month-day');
        if (day) day.focus();
      }
    });

    container.addEventListener('keydown', (e) => {
      if (e.target.matches('.tipo-select-mes')) {
        const day = e.target.closest('.month-day');
        if (!day || day.classList.contains('other-month')) return;
        
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          closeEmpDropdown();
          focusSiblingDay(day, -1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          closeEmpDropdown();
          focusSiblingDay(day, 1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusSiblingDay(day, 7);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusSiblingDay(day, -7);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          openEmpDropdown(day);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeEmpDropdown();
        }
        return;
      }

      const day = e.target.closest('.month-day');
      if (!day || day.classList.contains('other-month')) return;
      const isOpen = empDropdown && empDropdown.dayEl === day;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, 1);
      } else if (e.key === 'ArrowDown') {
      const day = e.target.closest('.month-day');
      if (!day || day.classList.contains('other-month')) return;

      const isOpen = empDropdown && empDropdown.dayEl === day;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, 1);
      } else if (e.key === 'ArrowDown') {
        if (!isOpen) {
          e.preventDefault();
          focusSiblingDay(day, 7);
          return;
        }
        e.preventDefault();
        if (empDropdown.filtered.length > 0) {
          empDropdown.selectedIdx = Math.min(empDropdown.selectedIdx + 1, empDropdown.filtered.length - 1);
          renderDropdownItems();
        }
      } else if (e.key === 'ArrowUp') {
        if (!isOpen) {
          e.preventDefault();
          focusSiblingDay(day, -7);
          return;
        }
        e.preventDefault();
        if (empDropdown.filtered.length > 0) {
          empDropdown.selectedIdx = Math.max(empDropdown.selectedIdx - 1, 0);
          renderDropdownItems();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isOpen) {
          if (empDropdown.selectedIdx >= 0) {
            confirmEmpSelection();
          } else {
            closeEmpDropdown();
          }
        } else {
          openEmpDropdown(day);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeEmpDropdown();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        openEmpDropdown(day, e.key.toLowerCase());
      }
    });

    container.addEventListener('focusout', (e) => {
      if (!empDropdown) return;
      const next = e.relatedTarget;
      if (!next || !container.contains(next)) {
        closeEmpDropdown();
      } else if (next.closest('.month-day') && next.closest('.month-day') !== empDropdown.dayEl) {
        closeEmpDropdown();
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!empDropdown) return;
      if (!container.contains(e.target)) {
        closeEmpDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!container.contains(document.activeElement)) return;
      const day = document.activeElement.closest('.month-day');
      if (!day || day.classList.contains('other-month')) return;

      const isOpen = empDropdown && empDropdown.dayEl === day;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        closeEmpDropdown();
        focusSiblingDay(day, 1);
      } else if (e.key === 'ArrowDown') {
        if (!isOpen) {
          e.preventDefault();
          focusSiblingDay(day, 7);
          return;
        }
        e.preventDefault();
        if (empDropdown.filtered.length > 0) {
          empDropdown.selectedIdx = Math.min(empDropdown.selectedIdx + 1, empDropdown.filtered.length - 1);
          renderDropdownItems();
        }
      } else if (e.key === 'ArrowUp') {
        if (!isOpen) {
          e.preventDefault();
          focusSiblingDay(day, -7);
          return;
        }
        e.preventDefault();
        if (empDropdown.filtered.length > 0) {
          empDropdown.selectedIdx = Math.max(empDropdown.selectedIdx - 1, 0);
          renderDropdownItems();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isOpen) {
          if (empDropdown.selectedIdx >= 0) {
            confirmEmpSelection();
          } else {
            closeEmpDropdown();
          }
        } else {
          openEmpDropdown(day);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeEmpDropdown();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        openEmpDropdown(day, e.key.toLowerCase());
      }
    });
  }

  function agregarChecks(fecha) {
    const tipoSelect = document.querySelector(`.tipo-select[data-fecha="${fecha}"]`);
    const tipo = tipoSelect ? tipoSelect.value : 'normal';

    const checkboxes = document.querySelectorAll(`input[data-fecha="${fecha}"]:checked`);
    if (!cronograma[fecha]) cronograma[fecha] = [];

    checkboxes.forEach(cb => {
      const emp = JSON.parse(cb.value);
      const yaExiste = cronograma[fecha].some(e => e.legajo === emp.legajo);
      if (!yaExiste) {
        cronograma[fecha].push({ ...emp, tipo });
      }
      cb.checked = false;
    });

    tipoSelect.value = 'normal';
    guardarCronograma();
    renderCalendars();
  }

  function eliminar(fecha, legajo) {
    if (cronograma[fecha]) {
      cronograma[fecha] = cronograma[fecha].filter(e => e.legajo !== legajo);
      guardarCronograma();
      renderCalendars();
    }
  }

  function cambiarTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calendar-view').forEach(v => v.classList.remove('active'));
    document.querySelector(`.tab:nth-child(${tab === 'semana' ? 1 : 2})`).classList.add('active');
    document.getElementById(`view-${tab}`).classList.add('active');
  }

  function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const diasSemana = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

    const ahora = new Date();
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);

    const fechaInicio = inicioSemana.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    const fechaFin = new Date(inicioSemana);
    fechaFin.setDate(inicioSemana.getDate() + 6);
    const fechaFinStr = fechaFin.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CRONOGRAMA SEMANAL', 105, 12, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Semana del ${fechaInicio} al ${fechaFinStr}`, 105, 20, { align: 'center' });

    let y = 30;
    const colWidth = 17;
    const rowHeight = 13;
    const legajoWidth = 20;
    const nombreWidth = 35;

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 240, 250);
    doc.rect(10, y, 190, 10, 'F');
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Leg', 12, y + 7);
    doc.text('Nombre', 32, y + 7);
    let xDias = 67;
    diasSemana.forEach(dia => {
      doc.text(dia, xDias + colWidth / 2, y + 7, { align: 'center' });
      xDias += colWidth;
    });

    y += 12;
    doc.setFont(undefined, 'normal');

    empleados.forEach((emp) => {
      doc.setFillColor(250, 250, 252);
      doc.rect(10, y, 190, rowHeight, 'F');

      doc.setFontSize(8);
      doc.text(String(emp.legajo), 12, y + 8);

      const nombreCorto = emp.nombre.split(' ');
      const nombreMostrar = nombreCorto.length >= 2
        ? nombreCorto[1].toUpperCase() + ', ' + nombreCorto[0].charAt(0).toUpperCase()
        : emp.nombre;
      doc.text(nombreMostrar, 32, y + 8);

      let x = 67;
      for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + i);
        const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        const asignados = cronograma[fechaStr] || [];
        const asignacion = asignados.find(a => a.legajo === emp.legajo);

        let texto, color;
        if (!asignacion) {
          texto = 'FRANCO';
          color = [239, 68, 68];
        } else if (asignacion.tipo === 'feriado') {
          texto = 'F.TRABAJ';
          color = [59, 130, 246];
        } else if (asignacion.tipo === 'feriado-franco') {
          texto = 'F.FRANCO';
          color = [244, 114, 182];
        } else if (asignacion.tipo === 'compensatorio') {
          texto = 'COMPENS.';
          color = [251, 191, 36];
        } else {
          texto = 'TRABAJA';
          color = [16, 185, 129];
        }

        doc.setFillColor(...color);
        doc.roundedRect(x + 1, y + 2, colWidth - 2, rowHeight - 4, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.text(texto, x + colWidth / 2, y + 8, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        doc.setDrawColor(220, 220, 230);
        doc.line(x, y, x, y + rowHeight);
        x += colWidth;
      }

      doc.setDrawColor(220, 220, 230);
      doc.line(10, y + rowHeight, 200, y + rowHeight);

      y += rowHeight;
    });

    y += 18;
    doc.setDrawColor(200, 200, 210);
    doc.line(10, y, 200, y);
    y += 10;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Referencias:', 10, y);

    const referencias = [
      { color: [16, 185, 129], label: 'TRABAJA (día normal)' },
      { color: [239, 68, 68], label: 'FRANCO (día libre)' },
      { color: [59, 130, 246], label: 'FERIADO TRABAJADO' },
      { color: [244, 114, 182], label: 'FERIADO FRANCO' },
      { color: [251, 191, 36], label: 'FRANCO COMPENSATORIO' }
    ];

    doc.setFont(undefined, 'normal');
    const cols = [10, 110];
    referencias.forEach((ref, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const rx = cols[col];
      const ry = y + 6 + row * 12;
      doc.setFillColor(...ref.color);
      doc.rect(rx, ry - 5, 8, 8, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.text(ref.label, rx + 12, ry);
    });

    const fechaIni = String(inicioSemana.getDate()).padStart(2, '0');
    const fechaFinPdf = String(fechaFin.getDate()).padStart(2, '0') + '-' + String(fechaFin.getMonth() + 1).padStart(2, '0') + '-' + fechaFin.getFullYear();
    doc.save(`cronograma-del-${fechaIni}-al-${fechaFinPdf}.pdf`);
  }
});

function setupWeekKeyboardNav() {
  console.log('setupWeekKeyboardNav llamado');
  try {
    const container = document.getElementById('view-semana');
    if (!container) {
      console.log('No se encontró view-semana');
      return;
    }
    console.log('Container encontrado');

  container.addEventListener('click', (e) => {
    const tipoSelect = e.target.closest('.tipo-select');
    if (tipoSelect) {
      const card = tipoSelect.closest('.day-card');
      if (card) card.focus();
      return;
    }

    const card = e.target.closest('.day-card');
    if (card) card.focus();
  });

  container.addEventListener('change', (e) => {
    if (e.target.matches('.tipo-select')) {
      const card = e.target.closest('.day-card');
      if (card) card.focus();
    }
  });

  container.addEventListener('keydown', (e) => {
    const card = e.target.closest('.day-card');
    if (!card) return;

    if (e.target.matches('.tipo-select')) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusSiblingCard(card, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusSiblingCard(card, 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusSiblingCard(card, 7);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusSiblingCard(card, -7);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusSiblingCard(card, -1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusSiblingCard(card, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusSiblingCard(card, 7);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusSiblingCard(card, -7);
    }
  });

  document.addEventListener('keydown', (e) => {
    console.log('Keydown global:', e.key, 'activeElement:', document.activeElement);
    console.log('Container contains:', container.contains(document.activeElement));
    
    if (!container.contains(document.activeElement)) return;
    const card = document.activeElement.closest('.day-card');
    console.log('Card found:', card);
    if (!card) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusSiblingCard(card, -1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusSiblingCard(card, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusSiblingCard(card, 7);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusSiblingCard(card, -7);
    }
  });
  } catch (e) {
    console.error('Error en setupWeekKeyboardNav:', e);
  }
}

function focusSiblingCard(card, direction) {
  const all = document.querySelectorAll('.day-card');
  const idx = Array.from(all).indexOf(card);
  const next = idx + direction;
  if (next >= 0 && next < all.length) {
    all[next].focus();
  }
}
