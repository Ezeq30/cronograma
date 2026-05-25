import { useEffect, useRef } from 'react';
import { empleados, TIPOS, TIPOS_AUSENCIA, HIPODROMOS, HIPODROMO_COLORS, DIAS, DIAS_CORTOS, formatDate, getDefaultHipodromo } from '../data/empleados';

export default function Grid({ cronograma, mes, año, tab, getCellValue, setCellValue, getHipodromo, setHipodromo, ausencias }) {
  const ahora = new Date();
  const hoyStr = formatDate(ahora);

  function parseFecha(str) {
    return new Date(str + 'T12:00:00');
  }

  // scrollRef + auto-scroll: al cargar la vista mensual, scrollea automáticamente
  // para que la columna del día de hoy quede como primera columna visible
  // Los días anteriores quedan accesibles scrolleando hacia la izquierda
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('.grid-day-header.today');
      if (el) scrollRef.current.scrollLeft = el.offsetLeft;
    }
  }, [tab, mes, año]);

  if (tab === 'semana') return renderSemana();
  return renderMes();

  function renderSemana() {
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      dias.push(d);
    }

    return (
      <div className="grid-container">
        <table className="grid-table">
          <thead>
            <tr className="row-hippo">
              <th className="grid-label">Hipódromo</th>
              {dias.map(d => renderHippoCell(d))}
            </tr>
            <tr className="row-dias">
              <th className="grid-label"></th>
              {dias.map(d => {
                const fs = formatDate(d);
                return (
                  <th key={fs} className={`grid-day-header ${fs === hoyStr ? 'today' : ''}`}>
                    <span className="day-name">{DIAS_CORTOS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</span>
                    <span className="day-num">{d.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.legajo}>
                <td className="grid-label">{emp.nombre.split(' ')[0]}</td>
                {dias.map(d => renderCell(d, emp, false))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderMes() {
    // Renderiza todos los días del mes (1 a fin de mes).
    // El auto-scroll (scrollRef) posiciona el día de hoy a la izquierda.
    const primerDia = new Date(año, mes - 1, 1).getDay();
    const diasEnMes = new Date(año, mes, 0).getDate();
    const offset = primerDia === 0 ? 6 : primerDia - 1;

    const dias = [];
    for (let i = 0; i < offset; i++) {
      dias.push(null);
    }
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const d = new Date(año, mes - 1, dia);
      dias.push(d);
    }

    return (
      <div className="grid-container grid-month-scroll" ref={scrollRef}>
        <table className="grid-table">
          <thead>
            <tr className="row-hippo">
              <th className="grid-label">Hipódromo</th>
              {dias.map((d, i) => d ? renderHippoCell(d, i) : <th key={`e-${i}`} className="grid-empty"></th>)}
            </tr>
            <tr className="row-dias">
              <th className="grid-label"></th>
              {dias.map((d, i) => {
                if (!d) return <th key={`e-${i}`} className="grid-empty"></th>;
                const fs = formatDate(d);
                const diaSemana = d.getDay();
                const nombreDia = diaSemana === 0 ? 6 : diaSemana - 1;
                return (
                  <th key={fs} className={`grid-day-header ${fs === hoyStr ? 'today' : ''}${d.getDay() === 1 ? ' grid-monday' : ''}`}>
                    <span className="day-name">{DIAS_CORTOS[nombreDia]}</span>
                    <span className="day-num">{d.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.legajo}>
                <td className="grid-label">{emp.nombre.split(' ')[0]}</td>
                {dias.map((d, i) => d ? renderCell(d, emp, true, i) : <td key={`e-${i}`} className="grid-empty"></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderHippoCell(d, idx) {
    const fs = formatDate(d);
    const hippo = getHipodromo(fs);
    const bgColor = hippo && HIPODROMO_COLORS[hippo] ? HIPODROMO_COLORS[hippo].ui : 'transparent';
    return (
      <th key={fs} className={`grid-hippo-cell${d.getDay() === 1 ? ' grid-monday' : ''}`} style={{ background: bgColor }}>
        <select
          value={hippo}
          onChange={e => setHipodromo(fs, e.target.value)}
          className="hippo-select"
        >
          <option value="">-</option>
          {HIPODROMOS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </th>
    );
  }

  function renderCell(d, emp, resumido, idx) {
    const fs = formatDate(d);
    const valor = getCellValue(fs, emp.legajo);
    const hippo = getHipodromo(fs);
    const bgColor = hippo && HIPODROMO_COLORS[hippo] ? HIPODROMO_COLORS[hippo].ui : '';
    const info = TIPOS[valor] || TIPOS.trabaja;

    const aus = ausencias?.find(a => a.legajo === emp.legajo && a.fecha === fs);
    if (aus) {
      const tipoAbs = TIPOS_AUSENCIA[aus.tipo];
      const isOtro = aus.tipo === 'otro';
      return (
        <td key={fs} className={`grid-cell cell-ausencia${d.getDay() === 1 ? ' grid-monday' : ''}`}
            style={{ background: isOtro ? 'rgba(220,38,38,0.15)' : (tipoAbs?.color + '20') }}>
          <span className="ausencia-text" style={{ color: tipoAbs?.color }}>
            {isOtro ? 'FRANCO' : tipoAbs?.label}
          </span>
        </td>
      );
    }

    let cellClass = 'grid-cell';
    if (fs === hoyStr) cellClass += ' today';
    if (info.label === 'T') cellClass += ' cell-trabaja';
    if (d.getDay() === 1) cellClass += ' grid-monday';

    const handleKeyDown = (e) => {
      const cell = e.target.closest('td');
      const row = cell?.parentElement;
      const cells = Array.from(row?.querySelectorAll('select') || []);
      const cellIndex = cells.indexOf(e.target);
      const rows = Array.from(row?.parentElement?.querySelectorAll('tr') || []);
      const rowIndex = rows.indexOf(row);
      const totalCols = cells.length;

      if (e.key === 'ArrowLeft' && cellIndex > 0) {
        e.preventDefault();
        cells[cellIndex - 1].focus();
      } else if (e.key === 'ArrowRight' && cellIndex < totalCols - 1) {
        e.preventDefault();
        cells[cellIndex + 1].focus();
      } else if (e.key === 'ArrowUp' && rowIndex > 0) {
        e.preventDefault();
        const prevRow = rows[rowIndex - 1];
        const prevCells = prevRow?.querySelectorAll('select');
        if (prevCells?.[cellIndex]) prevCells[cellIndex].focus();
      } else if (e.key === 'ArrowDown' && rowIndex < rows.length - 1) {
        e.preventDefault();
        const nextRow = rows[rowIndex + 1];
        const nextCells = nextRow?.querySelectorAll('select');
        if (nextCells?.[cellIndex]) nextCells[cellIndex].focus();
      }
    };

    return (
      <td key={fs} className={cellClass} style={bgColor ? { background: bgColor } : {}}>
        <select
          value={valor}
          onChange={e => setCellValue(fs, emp.legajo, e.target.value)}
          onKeyDown={handleKeyDown}
          className="tipo-select-grid"
        >
          {Object.entries(TIPOS).map(([key, t]) => (
            <option key={key} value={key}>{resumido ? t.label : t.pdf}</option>
          ))}
        </select>
      </td>
    );
  }
}
