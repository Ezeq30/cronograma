import { useState } from 'react';
import { generarPDF } from '../utils/pdf';

export default function Toolbar({ mes, año, cronograma, ausencias, onMesChange, onAñoChange, tab, onTabChange, onGuardar, isSaving, saveMsg }) {
  const [showPdfMsg, setShowPdfMsg] = useState(false);
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function handlePdf() {
    generarPDF(cronograma, ausencias);
    setShowPdfMsg(true);
    setTimeout(() => setShowPdfMsg(false), 2000);
  }

  return (
    <>
      <div className="controls">
        <select value={mes} onChange={e => onMesChange(Number(e.target.value))}>
          {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={año} onChange={e => onAñoChange(Number(e.target.value))}>
          {Array.from({ length: 7 }, (_, i) => 2024 + i).map(a =>
            <option key={a} value={a}>{a}</option>
          )}
        </select>
        <button className="btn-guardar" onClick={onGuardar} disabled={isSaving}>
          {isSaving ? '💾 Guardando...' : '💾 Guardar'}
        </button>
        {saveMsg && <span className="save-msg">{saveMsg}</span>}
        <button className="btn-pdf" onClick={handlePdf}>📄 Descargar PDF</button>
        {showPdfMsg && <span className="pdf-msg">PDF descargado</span>}
      </div>
      <div className="tabs">
        <div className={`tab ${tab === 'semana' ? 'active' : ''}`} onClick={() => onTabChange('semana')}>
          Vista Semanal
        </div>
        <div className={`tab ${tab === 'mes' ? 'active' : ''}`} onClick={() => onTabChange('mes')}>
          Vista Mensual
        </div>
        <div className={`tab ${tab === 'ausencias' ? 'active' : ''}`} onClick={() => onTabChange('ausencias')}>
          Ausencias
        </div>
      </div>
    </>
  );
}
