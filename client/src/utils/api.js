import { getDefaultHipodromo } from '../data/empleados';

function esFormatoViejo(data) {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data).some(v => Array.isArray(v));
}

function migrarDatos(data) {
  if (!esFormatoViejo(data)) return data;
  const nuevo = {};
  for (const [fecha, asignaciones] of Object.entries(data)) {
    const excepciones = [];
    for (const a of asignaciones) {
      if (a.tipo === 'normal') continue;
      excepciones.push({ legajo: a.legajo, tipo: a.tipo });
    }
    nuevo[fecha] = {
      hipodromo: getDefaultHipodromo(fecha),
      excepciones
    };
  }
  return nuevo;
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

async function cargarDesdeIPC() {
  const data = await window.electronAPI.loadData();
  if (data && typeof data === 'object') {
    const cronograma = migrarDatos(data.cronograma || {});
    const ausencias = data.ausencias || [];
    localStorage.setItem('cronograma', JSON.stringify({ cronograma, ausencias }));
    return { cronograma, ausencias };
  }
  return null;
}

function cargarDesdeLocal() {
  const local = localStorage.getItem('cronograma');
  if (!local) return null;
  try {
    const parsed = JSON.parse(local);
    if (parsed && parsed.cronograma !== undefined) {
      return {
        cronograma: migrarDatos(parsed.cronograma || {}),
        ausencias: parsed.ausencias || []
      };
    }
    return { cronograma: migrarDatos(parsed), ausencias: [] };
  } catch {
    return null;
  }
}

export async function cargarDatos() {
  if (isElectron) {
    const fromIPC = await cargarDesdeIPC();
    if (fromIPC) return fromIPC;
  }
  return cargarDesdeLocal() || { cronograma: {}, ausencias: [] };
}

export async function guardarDatos(cronograma, ausencias) {
  const data = { cronograma, ausencias };
  localStorage.setItem('cronograma', JSON.stringify(data));

  if (isElectron) {
    await window.electronAPI.saveData(data);
    return true;
  }

  throw new Error('No hay conexión IPC disponible');
}

export function guardarDatosLocal(cronograma, ausencias) {
  localStorage.setItem('cronograma', JSON.stringify({ cronograma, ausencias }));
}
