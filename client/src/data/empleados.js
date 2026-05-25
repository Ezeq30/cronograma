/**
 * EMPLEADOS.JS - Datos y constantes del cronograma
 * 
 * Este archivo contiene:
 * - Lista de empleados hardcodeados
 * - Tipos de asignación disponibles
 * - Hipódromos disponibles
 * - Funciones auxiliares para fechas
 */

// =======================
// EMPLEADOS
// =======================

/**
 * Lista de empleados del sector Cómputos
 * Cada empleado tiene:
 * - nombre: Nombre completo
 * - legajo: Número de legajo
 * - color: Color hexadecimal para identificar en la UI
 */
export const empleados = [
  { nombre: 'Raúl Martínez', legajo: 6867, color: '#ef4444' },  // Rojo
  { nombre: 'Gonzalo Alcaraz', legajo: 7287, color: '#f59e0b' }, // Amarillo
  { nombre: 'Ezequiel Díaz', legajo: 7701, color: '#10b981' },   // Verde
  { nombre: 'Mariel Nieva', legajo: 7022, color: '#3b82f6' },    // Azul
  { nombre: 'Santiago Machado', legajo: '---', color: '#8b5cf6' }  // Violeta (extra)
];

// =======================
// TIPOS DE ASIGNACIÓN
// =======================

/**
 * Define los 4 tipos de asignación posibles para cada día
 * Cada tipo tiene:
 * - label: Letra corta para mostrar en el select de la grilla
 * - pdf: Texto que aparece en el PDF generado
 */
export const TIPOS = {
  // Día normal de trabajo
  trabaja:        { label: 'T',  pdf: 'TRABAJA' },
  
  // Día libre / franco
  franco:         { label: 'F',  pdf: 'FRANCO' },
  
  // Feriado que se trabaja
  feriado:        { label: 'FT', pdf: 'FERIADO' },
  
  // Franco compensatorio por haber trabajado en feriado
  compensatorio:  { label: 'C',  pdf: 'COMPENS.' }
};

// =======================
// HIPÓDROMOS
// =======================

/**
 * Lista de hipódromos disponibles para asignar a cada día
 * Cada día de la semana tiene un hipódromo por defecto
 */
export const TIPOS_AUSENCIA = {
  vacaciones: { label: 'Vacaciones', color: '#f59e0b' },
  estudio: { label: 'Estudio', color: '#3b82f6' },
  art: { label: 'ART', color: '#ef4444' },
  enfermedad: { label: 'Enfermedad', color: '#8b5cf6' },
  otro: { label: 'Otro', color: '#dc2626' }
};

export const HIPODROMOS = ['SI', 'LP', 'PAL'];

/**
 * Colores para cada hipódromo
 * - ui: Color rgba semitransparente para la UI
 * - pdf: Array RGB para el PDF
 */
export const HIPODROMO_COLORS = {
  SI:  { ui: 'rgba(16, 185, 129, 0.25)',  pdf: [180, 230, 190] }, // Verde
  LP:  { ui: 'rgba(59, 130, 246, 0.25)',  pdf: [180, 210, 240] }, // Azul
  PAL: { ui: 'rgba(251, 191, 36, 0.25)',  pdf: [245, 230, 180] }  // Amarillo
};

/**
 * Obtiene el hipódromo por defecto según el día de la semana
 * Lunes(PAL), Martes(LP), Miércoles(SI), Jueves(LP), Viernes(SI)
 * Fin de semana: vacío
 */
export function getDefaultHipodromo(fechaStr) {
  const fecha = new Date(fechaStr + 'T12:00:00');
  const dia = fecha.getDay(); // 0=Domingo, 1=Lunes, etc.
  
  switch (dia) {
    case 1: return 'PAL'; // Lunes
    case 2: return 'LP';  // Martes
    case 3: return 'SI';  // Miércoles
    case 4: return 'LP';  // Jueves
    case 5: return 'SI';  // Viernes
    default: return '';   // Sábado y Domingo
  }
}

// =======================
// FUNCIONES DE FECHA
// =======================

/**
 * Convierte un objeto Date a string en formato YYYY-MM-DD
 * Ejemplo: 2024-05-19
 */
export function formatDate(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes 1-12
  const día = String(fecha.getDate()).padStart(2, '0');      // Día 01-31
  return `${año}-${mes}-${día}`;
}

// =======================
// DÍAS DE LA SEMANA
// =======================

/**
 * Nombres completos de los días
 */
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Nombres cortos de los días (para el PDF)
 */
export const DIAS_CORTOS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];