import { useState, useEffect } from 'react';
import Login from './components/Login';
import Grid from './components/Grid';
import Toolbar from './components/Toolbar';
import Ausencias from './components/Ausencias';
import { cargarDatos, guardarDatos, guardarDatosLocal } from './utils/api';
import { empleados, getDefaultHipodromo, TIPOS, formatDate } from './data/empleados';
import './App.css';

function getCellValue(cronograma, fechaStr, legajo) {
  const dia = cronograma[fechaStr];
  if (!dia) return 'trabaja';
  const exc = dia.excepciones?.find(e => e.legajo === legajo);
  return exc ? exc.tipo : 'trabaja';
}

function getHipodromoVal(cronograma, fechaStr) {
  return cronograma[fechaStr]?.hipodromo ?? getDefaultHipodromo(fechaStr);
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState('semana');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [cronograma, setCronograma] = useState({});
  const [ausencias, setAusencias] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (loggedIn && !loaded) {
      cargarDatos().then(({ cronograma: c, ausencias: a }) => {
        setCronograma(c);
        setAusencias(a);
        setLoaded(true);
      });
    }
  }, [loggedIn, loaded]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  function agregarAusencia(legajo, fecha, tipo) {
    const nuevo = [...ausencias, { legajo, fecha, tipo }];
    setAusencias(nuevo);
    guardarDatosLocal(cronograma, nuevo);
  }

  function agregarRangoAusencia(legajo, desde, hasta, tipo) {
    const fechas = [];
    const start = new Date(desde + 'T12:00:00');
    const end = new Date(hasta + 'T12:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const fs = formatDate(d);
      if (!ausencias.some(a => a.legajo === legajo && a.fecha === fs)) {
        fechas.push({ legajo, fecha: fs, tipo });
      }
    }
    if (fechas.length === 0) return;
    const nuevo = [...ausencias, ...fechas];
    setAusencias(nuevo);
    guardarDatosLocal(cronograma, nuevo);
  }

  function eliminarAusencia(legajo, fecha) {
    const nuevo = ausencias.filter(a => !(a.legajo === legajo && a.fecha === fecha));
    setAusencias(nuevo);
    guardarDatosLocal(cronograma, nuevo);
  }

  function setCellValue(fechaStr, legajo, tipo) {
    const nuevo = { ...cronograma };
    if (!nuevo[fechaStr]) {
      nuevo[fechaStr] = { hipodromo: getDefaultHipodromo(fechaStr), excepciones: [] };
    }
    const dia = { ...nuevo[fechaStr] };
    if (tipo === 'trabaja') {
      dia.excepciones = (dia.excepciones || []).filter(e => e.legajo !== legajo);
    } else {
      dia.excepciones = [...(dia.excepciones || []).filter(e => e.legajo !== legajo), { legajo, tipo }];
    }
    nuevo[fechaStr] = dia;
    setCronograma(nuevo);
    guardarDatosLocal(nuevo, ausencias);
  }

  function setHipodromo(fechaStr, valor) {
    const nuevo = { ...cronograma };
    if (!nuevo[fechaStr]) {
      nuevo[fechaStr] = { hipodromo: valor, excepciones: [] };
    } else {
      nuevo[fechaStr] = { ...nuevo[fechaStr], hipodromo: valor };
    }
    setCronograma(nuevo);
    guardarDatosLocal(nuevo, ausencias);
  }

  async function guardarEnDisco() {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await guardarDatos(cronograma, ausencias);
      setSaveMsg('✓ Guardado');
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (err) {
      setSaveMsg(`✗ Error: ${err.message}`);
      setTimeout(() => setSaveMsg(null), 8000);
    }
    setIsSaving(false);
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return (
    <div className="app">
      <header className="header">
        <h1>Cronograma</h1>
        <div className="header-right">
          <button className="btn-theme" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-logout" onClick={() => setLoggedIn(false)}>Cerrar Sesión</button>
        </div>
      </header>
      <div className="ref-bar">
        {Object.entries(TIPOS).map(([key, t]) => (
          <span key={key} className="ref-item"><strong>{t.label}</strong> = {t.pdf}</span>
        ))}
      </div>
      <Toolbar
        mes={mes}
        año={año}
        cronograma={cronograma}
        ausencias={ausencias}
        onMesChange={setMes}
        onAñoChange={setAño}
        tab={tab}
        onTabChange={setTab}
        onGuardar={guardarEnDisco}
        isSaving={isSaving}
        saveMsg={saveMsg}
      />
      {tab === 'ausencias' ? (
        <Ausencias
          ausencias={ausencias}
          onAgregarAusencia={agregarAusencia}
          onAgregarRangoAusencia={agregarRangoAusencia}
          onEliminarAusencia={eliminarAusencia}
          mes={mes}
          año={año}
          onMesChange={setMes}
          onAñoChange={setAño}
        />
      ) : (
        <div className="grid-wrapper">
          <Grid
            cronograma={cronograma}
            mes={mes}
            año={año}
            tab={tab}
            ausencias={ausencias}
            getCellValue={(f, l) => getCellValue(cronograma, f, l)}
            setCellValue={setCellValue}
            getHipodromo={f => getHipodromoVal(cronograma, f)}
            setHipodromo={setHipodromo}
          />
        </div>
      )}
    </div>
  );
}
