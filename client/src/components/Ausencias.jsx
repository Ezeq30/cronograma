import { useState, useEffect, useRef } from 'react';
import { empleados, TIPOS_AUSENCIA, formatDate } from '../data/empleados';

export default function Ausencias({ ausencias, onAgregarAusencia, onAgregarRangoAusencia, onEliminarAusencia, mes, año, onMesChange, onAñoChange }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedDia, setSelectedDia] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [rangoDesde, setRangoDesde] = useState('');
  const [rangoHasta, setRangoHasta] = useState('');

  const hoy = new Date();
  const hoyStr = formatDate(hoy);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const primerDia = new Date(año, mes - 1, 1).getDay();
  const diasEnMes = new Date(año, mes, 0).getDate();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const totalDias = offset + diasEnMes;
  const semanas = Math.ceil(totalDias / 7);

  // Auto-scroll al día de hoy: al cargar la grilla anual de ausencias,
  // scrollea para que la columna del día actual sea la primera visible.
  // Los días previos se ven scrolleando a la izquierda.
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('.grid-day-header.today');
      if (el) scrollRef.current.scrollLeft = el.offsetLeft;
    }
  }, [mes, año]);

  const dias = [];
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    dias.push(new Date(año, mes - 1, dia));
  }
  while (dias.length < semanas * 7) dias.push(null);

  function getAusencia(legajo, fechaStr) {
    return ausencias.find(a => a.legajo === legajo && a.fecha === fechaStr);
  }

  function handleCellClick(legajo, d) {
    if (!d) return;
    const fs = formatDate(d);
    if (fs < hoyStr) return;
    const existente = getAusencia(legajo, fs);
    if (existente) {
      onEliminarAusencia(legajo, fs);
    } else {
      setSelectedEmp(legajo);
      setSelectedDia(fs);
      setIsRange(false);
      setRangoDesde(fs);
      setRangoHasta(fs);
      setShowPicker(true);
    }
  }

  function handleSelectTipo(tipo) {
    if (selectedEmp && selectedDia) {
      if (isRange && rangoDesde && rangoHasta) {
        onAgregarRangoAusencia(selectedEmp, rangoDesde, rangoHasta, tipo);
      } else {
        onAgregarAusencia(selectedEmp, selectedDia, tipo);
      }
    }
    cerrarPicker();
  }

  function cerrarPicker() {
    setShowPicker(false);
    setSelectedEmp(null);
    setSelectedDia(null);
    setIsRange(false);
    setRangoDesde('');
    setRangoHasta('');
  }

  return (
    <div className="ausencias-wrapper">
      <div className="ausencias-controls">
        <select value={mes} onChange={e => onMesChange(Number(e.target.value))}>
          {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={año} onChange={e => onAñoChange(Number(e.target.value))}>
          {Array.from({ length: 7 }, (_, i) => 2024 + i).map(a =>
            <option key={a} value={a}>{a}</option>
          )}
        </select>
        <span className="ausencias-legend">
          {Object.entries(TIPOS_AUSENCIA).map(([k, v]) => (
            <span key={k} className="ausencias-legend-item">
              <span className="ausencias-dot" style={{ background: v.color }}></span>
              {v.label}
            </span>
          ))}
        </span>
      </div>

      <div className="grid-container ausencias-grid" ref={scrollRef}>
        <table className="grid-table">
          <thead>
            <tr>
              <th className="grid-label">Empleado</th>
              {dias.map((d, i) => {
                if (!d) return <th key={`e-${i}`} className="grid-empty"></th>;
                const diaSemana = d.getDay();
                const nombreDia = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'][diaSemana === 0 ? 6 : diaSemana - 1];
                const fs = formatDate(d);
                return (
                  <th key={fs} className={`grid-day-header ${fs === hoyStr ? 'today' : ''}${d.getDay() === 1 ? ' grid-monday' : ''}`}>
                    <span className="day-name">{nombreDia}</span>
                    <span className="day-num">{d.getDate()}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => (
              <tr key={emp.legajo}>
                <td className="grid-label">
                  {emp.nombre.split(' ')[0]}
                </td>
                {dias.map((d, i) => {
                  if (!d) return <td key={`e-${i}`} className="grid-empty"></td>;
                  const fs = formatDate(d);
                  const aus = getAusencia(emp.legajo, fs);
                  const esFuturo = fs >= hoyStr;
                  return (
                    <td
                      key={fs}
                      className={`grid-cell ausencia-cell${aus ? ' has-ausencia' : ''}${!esFuturo ? ' ausencia-past' : ''}${d.getDay() === 1 ? ' grid-monday' : ''}`}
                      style={aus ? { background: TIPOS_AUSENCIA[aus.tipo]?.color + '25' } : {}}
                      onClick={() => handleCellClick(emp.legajo, d)}
                      title={aus ? `${TIPOS_AUSENCIA[aus.tipo]?.label} - Click para quitar` : (esFuturo ? 'Click para agregar ausencia' : '')}
                    >
                      {aus ? (
                        <span className="ausencia-badge" style={{ color: TIPOS_AUSENCIA[aus.tipo]?.color }}>
                          {TIPOS_AUSENCIA[aus.tipo]?.label}
                        </span>
                      ) : (
                        esFuturo && <span className="ausencia-add">+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPicker && (
        <div className="ausencia-picker-overlay" onClick={cerrarPicker}>
          <div className="ausencia-picker" onClick={e => e.stopPropagation()}>
            <h3>Seleccionar tipo de ausencia</h3>
            <p className="ausencia-picker-sub">{isRange ? `${rangoDesde} → ${rangoHasta}` : selectedDia}</p>

            {isRange && (
              <div className="ausencia-range-inputs">
                <label>
                  Desde
                  <input type="date" value={rangoDesde} onChange={e => setRangoDesde(e.target.value)} />
                </label>
                <label>
                  Hasta
                  <input type="date" value={rangoHasta} onChange={e => setRangoHasta(e.target.value)} />
                </label>
              </div>
            )}

            <button className="ausencia-range-toggle" onClick={() => setIsRange(!isRange)}>
              {isRange ? '✓ Rango activado' : '📅 Rango de fechas'}
            </button>

            <div className="ausencia-picker-options">
              {Object.entries(TIPOS_AUSENCIA).map(([k, v]) => (
                <button
                  key={k}
                  className="ausencia-picker-btn"
                  style={{ '--btn-color': v.color }}
                  onClick={() => handleSelectTipo(k)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button className="ausencia-picker-cancel" onClick={cerrarPicker}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
