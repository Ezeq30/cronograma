# Cronograma Computos

Aplicación de escritorio para la gestión semanal de empleados del sector Cómputos. Permite asignar turnos, feriados y francos compensatorios, gestionar ausencias, con vista semanal/mensual y exportación a PDF.

## Empleados

| Nombre | Legajo | Color |
|--------|--------|-------|
| Raúl Martínez | 6867 | Rojo |
| Gonzalo Alcaraz | 7287 | Amarillo |
| Ezequiel Díaz | 7701 | Verde |
| Mariel Nieva | 7022 | Azul |
| Santiago Machado | --- | Violeta |

## Login

- **Usuario:** admin
- **Contraseña:** computos
- **Imagen:** Logo corporativo centrado con glassmorphism

## Tipos de Asignación

| Tipo | Descripción | Color PDF |
|------|-------------|-----------|
| Trabaja (T) | Día trabajado común | Verde |
| Franco (F) | Día libre/franco | Rojo |
| Feriado (FT) | Feriado trabajado | Azul |
| Compensatorio (C) | Franco por feriado trabajado | Amarillo |

## Ausencias

Sistema de gestión de ausencias por empleado con calendario anual y modal de selección:

| Tipo | Color | En grilla/PDF |
|------|-------|---------------|
| Vacaciones | Amarillo | Nombre del tipo |
| Estudio | Azul | Nombre del tipo |
| ART | Rojo | Nombre del tipo |
| Enfermedad | Violeta | Nombre del tipo |
| Otro | Rojo | Se muestra como "FRANCO" |

**Funcionamiento:**
- Las ausencias bloquean la celda en la grilla (no se puede cambiar asignación)
- Ausencias pasadas se ven atenuadas y no bloquean
- Tipo "Otro" se muestra como "FRANCO" tanto en grilla como en PDF (mismo color rojo)

## Estructura del Proyecto

```
cronograma/
├── client/               # Código frontend (Vite + React)
│   ├── src/             # Componentes React
│   │   ├── data/        # empleados.js (TIPOS, empleados, hipódromos)
│   │   ├── components/  # Grid, Toolbar, Login, Legend, Ausencias
│   │   └── utils/       # pdf.js, api.js
│   ├── public/          # image.png
│   ├── index.html       # Entry point con CDNs
│   ├── package.json     # Dependencias frontend
│   └── dist/            # Build de producción
├── dist/                # Copia de client/dist para electron-builder
├── release/
│   └── cronograma.exe   # Ejecutable portable (Electron)
├── electron.js          # Main de Electron (IPC)
├── preload.js           # Bridge IPC (contextBridge)
├── package.json         # Configuración principal + build
├── datos.json           # Datos persistentes (misma carpeta que .exe)
├── README.md            # Documentación
└── AGENTS.md            # Guía para agentes de IA
```

## Modos de Uso

### 1. Ejecutable (Windows)

Solo necesitás `cronograma.exe`. Hacé doble-click y se abre la aplicación.

**Requisitos:**
- Windows 10/11
- Conexión a internet (para Google Fonts y jsPDF desde CDN)

**Datos:** Se guardan en `datos.json` en la misma carpeta donde está el `.exe`.

**Mover datos entre PCs:** Copiá ambos archivos (exe + datos.json) juntos a la otra PC.

### 2. Desarrollo (Node.js)

```bash
npm install
npm run dev         # Frontend (Vite) en localhost:5173
npm run electron    # Electron (conecta a Vite en dev)
```

### 3. Compilar

```bash
npm run build
```

Genera `release/cronograma.exe` (portable, ~76 MB).

**Nota:** El build copia automáticamente `client/dist` a `dist/` antes de empacar.

## Stack Tecnológico

- **Frontend:** React + Vite
- **Backend:** Electron + IPC
- **PDF:** jsPDF + html2canvas
- **Build:** electron-builder (portable)

## CDNs Requeridos

- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700`
- **jsPDF:** `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

Sin internet la app funciona pero el PDF no se genera y la fuente se ve distinta.

## Características

- **Login** con imagen corporativa, fondo glassmorphism y animación
- **Tema oscuro/claro:** Toggle persistido en localStorage, CSS variables
- **Vista Semanal:** Tarjetas por día de la semana actual
- **Vista Mensual:** Calendario completo del mes seleccionado
- **Selector de mes/año:** Navegación entre meses (2024-2030)
- **Asignación:** Select con 4 opciones (Trabaja, Franco, Feriado, Compensatorio)
- **Hipódromos:** SI (verde), LP (azul), PAL (amarillo) - color de fondo por día
- **Ausencias:** Gestión por empleado con calendario anual y 5 tipos
- **Persistencia:** localStorage (automático) + botón "💾 Guardar" → IPC → datos.json (junto al .exe)
- **Auto-scroll hoy:** En vista mensual y ausencias, el día de hoy aparece como primera columna visible
- **Guardado explícito:** Botón "💾 Guardar" en la toolbar, persiste todos los cambios a datos.json via IPC
- **Exportación PDF:** Descarga PDF semanal con referencias de colores
- **Electron portable:** Un solo archivo exe sin instalación
- **Datos portables:** datos.json en la misma carpeta que el exe, fácil de mover entre PCs

## Errores Comunes

- **datos.json no se crea:** Verificar permisos de escritura en la carpeta del exe. El .exe portable extrae a temp, usar `PORTABLE_EXECUTABLE_DIR`. Usar Debug Info en la app para diagnosticar
- **Modo claro poco legible:** Revisar variables CSS en `.light-mode`
- **Pantalla en blanco en build:** Verificar que `vite.config.js` tenga `base: './'`

## Historial de Cambios

### v3.2.0
- Eliminado Express, migración completa a Electron IPC
- Agregado `preload.js` con puente contextBridge
- Fix persistencia en portable: `PORTABLE_EXECUTABLE_DIR`
- Ruta base relativa (`base: './'`) para build Vite

### v3.1.0
- Auto-scroll al día de hoy en vista mensual y ausencias
- Botón "💾 Guardar" para persistir cambios a datos.json
- Los cambios se guardan en localStorage automáticamente
- Al iniciar, carga desde datos.json primero (IPC/API), fallback a localStorage

### v3.0.0
- Sistema completo de ausencias con calendario anual
- Tipo "Otro" que se muestra como FRANCO en grilla y PDF
- Tema claro/oscuro con toggle y persistencia
- Login con imagen corporativa
- Hipódromos más visibles (opacidad 0.15 → 0.25)

### v2.1.0
- Reducido a 4 tipos de asignación: Trabaja, Franco, Feriado, Compensatorio
- PDF con referencias actualizadas
- Build optimizado con copia de dist/

### v2.0.0
- Migración de pkg a Electron
- Cambio de vanilla JS a React + Vite
- datos.json se guarda junto al executable
- Genera archivo portable único (cronograma.exe)
