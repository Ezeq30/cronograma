# AGENTS.md — Guía para Agentes de IA

## Resumen del Proyecto

Aplicación de escritorio para gestión de cronograma de empleados. Usa Electron con IPC (sin Express embebido), frontend React + Vite, y exporta a PDF. Genera ejecutable portable (un solo archivo).

Stack: Node.js + Electron + React + Vite + jsPDF + electron-builder

## Arquitectura

```
┌──────────────────────────────────────────────────┐
│  cronograma.exe (Electron portable)              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ electron.js│  │   dist/    │  │  preload.js│ │
│  │ (ipcMain)  │  │ (React)   │  │ (bridge)   │ │
│  └────────────┘  └────────────┘  └────────────┘ │
│  ┌────────────┐                                  │
│  │ datos.json │  ← junto al .exe                  │
│  └────────────┘                                  │
└──────────────────────────────────────────────────┘
```

### electron.js (Main de Electron)

Maneja la ventana principal y los handlers IPC:
- `getAppPath()` - ruta de la app (usa `app.getAppPath()` en producción)
- `getDataPath()` - ruta para datos: `__dirname` en dev, `PORTABLE_EXECUTABLE_DIR` (variable de electron-builder) en portable, `path.dirname(process.execPath)` como fallback
- `ipcMain.handle('load-data')` - Lee datos.json y retorna el cronograma
- `ipcMain.handle('save-data')` - Escribe datos.json
- `ipcMain.handle('get-debug-info')` - Diagnóstico

### preload.js

Usa `contextBridge.exposeInMainWorld` para exponer `window.electronAPI`:
- `loadData()` → invoke 'load-data'
- `saveData(data)` → invoke 'save-data'
- `getDebugInfo()` → invoke 'get-debug-info'

### client/ (Frontend)

Estructura del código React:
```
client/src/
├── data/
│   └── empleados.js     # Empleados, TIPOS, HIPODROMOS, TIPOS_AUSENCIA, funciones de fecha
├── components/
│   ├── Grid.jsx        # Grilla semanal y mensual (auto-scroll al día de hoy)
│   ├── Toolbar.jsx     # Controles de mes/año, tabs, botón PDF
│   ├── Login.jsx       # Pantalla de login
│   ├── Legend.jsx      # Leyenda de colores
│   └── Ausencias.jsx   # Gestión de ausencias (vacaciones, estudio, ART, enfermedad, otro)
├── utils/
│   ├── pdf.js          # Generación de PDF con jsPDF
│   └── api.js          # Carga/guardado de datos (localStorage + IPC o fetch)
├── App.jsx             # Componente principal (theme toggle, ausencias handlers)
├── App.css             # Estilos globales + CSS variables (dark/light mode)
└── main.jsx           # Entry point
```

## Tipos de Asignación

4 opciones disponibles (definidos en `empleados.js`):
- `trabaja` - T - Día normal de trabajo (verde)
- `franco` - F - Día libre (rojo)
- `feriado` - FT - Feriado trabajado (azul)
- `compensatorio` - C - Franco compensatorio (amarillo)

## Ausencias

Sistema de gestión de ausencias por empleado. Tipos disponibles (definidos en `empleados.js` como `TIPOS_AUSENCIA`):
- `vacaciones` - Vacaciones programadas (amarillo)
- `estudio` - Día de estudio (azul)
- `art` - ART (rojo)
- `enfermedad` - Enfermedad (violeta)
- `otro` - Día por compromiso (rojo, se muestra como FRANCO en grilla y PDF)

### Flujo de uso:
1. Ir al tab "Ausencias"
2. Click en un día futuro de un empleado
3. Se abre un modal para seleccionar el tipo de ausencia
4. Al confirmar, se guarda en datos.json y localStorage

### Auto-scroll al día de hoy:
- En vista mensual y en la grilla de Ausencias, el contenedor se scrollea automáticamente para que la columna del día actual quede como primera columna visible
- Los días anteriores al día de hoy siguen presentes y se acceden scroleando hacia la izquierda
- Implementado con `useRef` + `useEffect`, calculando `offsetLeft` del header con clase `.today`

### Bloqueo en Grid:
- Si un empleado tiene ausencia registrada en una fecha futura, en la grilla semanal/mensual ese día muestra el tipo de ausencia como texto fijo (no se puede cambiar)
- Excepción: tipo `otro` se muestra como "FRANCO" en la grilla y "FRANCO" en PDF
- Para desbloquear: eliminar la ausencia manualmente desde la vista de Ausencias
- Ausencias pasadas se muestran como atenuadas y no bloquean

## Convenciones y Reglas

1. **Estructura**: client/ para frontend, electron.js para main, preload.js para bridge IPC
2. **Build**: ejecutar `npm run build` (hace prebuild que copia client/dist a dist/)
3. **Datos**: `getDataPath()` → `__dirname` en dev, `PORTABLE_EXECUTABLE_DIR` (variable de electron-builder) en portable, `path.dirname(process.execPath)` como fallback
4. **Empleados**: hardcodeados en `client/src/data/empleados.js`
5. **Usuario**: 'admin', **Contraseña**: 'computos'
6. **Persistir**: localStorage + IPC (en Electron) o fetch (en servidor standalone), cargar desde datos.json primero, fallback a localStorage
7. **Tema**: light/dark mode con CSS variables, persistido en localStorage como 'theme'
8. **Login**: imagen image.png en client/public, fondo glassmorphism

## Build (Importante)

El script de build hace 3 cosas:
1. `npm run build:client` → genera `client/dist/`
2. `npm run prebuild` → copia `client/dist/` a `dist/` (necesario para electron-builder)
3. `electron-builder` → empaqueta en portable

```bash
npm run build
# Output: release/cronograma.exe
```

El build completo puede tardar hasta 5 minutos en ejecutarse completamente.

## Comandos

```bash
npm run dev         # cd client && npx vite (localhost:5173)
npm run electron    # electron . (conecta a Vite en dev, o a dist/ en prod)
npm run build:client # Build solo el frontend
npm run build       # Build completo (client + electron)
```

## Comunicación (IPC)

api.js detecta automáticamente el entorno:
- **En Electron**: usa `window.electronAPI.loadData/saveData` (IPC)
- **Sin Electron** (browser dev): usa solo localStorage
- **Siempre**: guarda en localStorage como respaldo

## Data Flow

```
Usuario cambia asignación → React
  → guardarDatosLocal → solo localStorage (rápido, cambios visibles al instante)

Usuario hace click en "💾 Guardar" → Toolbar
  → guardarDatos() → localStorage + IPC invoke('save-data')
    → electron.js escribe datos.json

Al iniciar app en Electron → cargarDatos()
  → window.electronAPI.loadData() (IPC)
  → si no responde, usa localStorage como fallback

Al iniciar app sin Electron → cargarDatos()
  → usa localStorage directamente
```

## Hipódromos

3 hipódromos disponibles: SI, LP, PAL
- Cada día de semana tiene hipódromo por defecto
- Colores semitransparentes en la grilla (opacidad 0.25)
- Colores en PDF: arrays RGB

## Errores Comunes

- **dist/index.html not found**: Ejecutar `npm run build` completo
- **datos.json no se crea**: Verificar permisos de escritura. El .exe portable extrae a temp, usar `PORTABLE_EXECUTABLE_DIR` para la ruta datos. Usar IPC getDebugInfo() para diagnosticar
- **Modo claro no se ve bien**: Revisar CSS variables en `.light-mode` de App.css
- **Error de build (winCodeSign)**: Relacionado a symlinks en Windows. Ver `node_modules\builder-util\out\util.js` línea 374 (exit code 2). Si se pierde el fix, hay que modificar executeAppBuilder para resolver en exit code 2

## Temas (Light/Dark)

- Dark mode por defecto (CSS variables en `:root`)
- Light mode toggle guardado en localStorage
- Variables de color: bg-primary/secondary/tertiary/card, text-primary/secondary/muted, border, glass-bg, glow

## CDNs Requeridos

Cargados desde `client/index.html`:
- Google Fonts (Inter): `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700`
- jsPDF: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

Sin internet: fuente fallback, PDF no disponible.

## .gitignore

```
node_modules/
client/node_modules/
client/dist/
dist/
release/
app/
datos.json
cronograma.exe
```

## Archivos Comentados

Los siguientes archivos tienen comentarios detallados:
- `electron.js` - Main process de Electron (handlers IPC)
- `preload.js` - Bridge de comunicación (contextBridge)
- `client/src/data/empleados.js` - Datos y constantes
- `client/src/utils/pdf.js` - Generación de PDF
- `client/src/utils/api.js` - Persistencia, migración, detección de entorno
