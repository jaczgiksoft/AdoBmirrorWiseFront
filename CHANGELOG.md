# 📑 CHANGELOG - BWISE Dental Desktop (Electron)

Todos los cambios relevantes del proyecto serán documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [0.3.0] - 2025-11-11

### Added
- **Gestión completa de pacientes (módulo clínico):**
  - Nuevo componente `PatientList.jsx`:
    - Diseño dividido en **dos columnas**:  
      📊 *Dashboard lateral* con métricas y gráficos.  
      📋 *Listado principal* de pacientes con paginación y búsqueda.
    - Soporte de **atajos de teclado** (`↑ ↓ Enter F12 Supr Ctrl+F1`) mediante `useHotkeys`.
    - **Filtro dinámico** y búsqueda con *debounce*.
    - Integración con servicio `patient.service.js` para carga paginada.
    - Tarjetas de pacientes con diseño responsive (2–5 columnas según ancho de pantalla).
    - Acciones rápidas: editar ✏️ y eliminar 🗑️ con diálogo de confirmación (`ConfirmDialog`).
    - Formulario modal `PatientForm` para alta rápida (campos base del paciente).

- **Nuevo componente `PatientDashboard.jsx`:**
  - Panel lateral moderno con métricas resumidas:
    - Total de pacientes.
    - En tratamiento.
    - Porcentajes activos.
    - Distribución por fases (I, II, Retenedor, Alta).
  - **Gráfico de anillo animado (Recharts + Framer Motion)** con colores clínicos.
  - Tarjetas visuales con sombras internas y estilo dark profesional.

- **Componente adicional `PatientAgeChart.jsx`:**
  - Segundo gráfico de anillo para comparar **Infantes vs Adultos**.
  - Cálculo automático de edad a partir de `birth_date`.
  - Visualización porcentual con leyenda y animaciones de entrada.
  - Diseño coherente con el dashboard principal.

### Changed
- **Estructura de `PatientList.jsx`:**
  - Encabezado principal (“Gestión de pacientes”) movido fuera del listado para abarcar todo el módulo.
  - Mejora de espaciado (`max-w-[90rem]`, `gap-6`) y consistencia visual con el resto del sistema.
  - Contenedor del dashboard lateral con `sticky top-6` para mantener la vista fija al hacer scroll.

- **Estética general:**
  - Actualización de las tarjetas y gráficos al esquema `bg-secondary` con sombras internas (`shadow-inner`).
  - Ajuste de bordes (`rounded-2xl`) y contraste para mejor legibilidad en modo oscuro.

---

## [0.2.0] - 2025-11-10
### Added
- **QuickAccessBar (Sidebar interactivo):**
    - Nuevo componente `src/components/layout/QuickAccessBar.jsx`.
    - Dock lateral fijo con accesos directos a los módulos principales:
        - Inicio, Pacientes, Calendario, Inventarios, Facturación, Empleados, Estudio de fotos y Configuración.
    - Tooltips animados que muestran el nombre completo al pasar el cursor.
    - Integración de rutas con `react-router-dom` para navegación directa.
    - Botón “+” animado con rotación para agregar accesos rápidos futuros.
    - Incorporado al `PrivateLayout` con margen lateral (`ml-[60px]`) para evitar solapamiento.

- **Header actualizado:**
    - Ahora muestra la **foto de perfil del usuario** obtenida desde la API (`API_BASE`).
    - Fallback automático al ícono de usuario (`User`) si no hay imagen.
    - Reordenamiento visual: **Notificaciones → Foto → Bienvenida → Cerrar sesión**.
    - Imagen cuadrada (`rounded-lg`) con sombra y borde adaptados al tema oscuro.
    - Soporte completo para rutas absolutas en imágenes de perfil.
    - Mejoras visuales y consistencia con la UI general.

- **Dashboard clínico (base visual):**
    - Adaptación del dashboard del POS al entorno clínico.
    - Estructura modular para futuras secciones: Pacientes, Citas, Inventario, Configuración, etc.
    - Integración con `useAuthStore` y permisos de módulos.
    - Preparado para futuras extensiones clínicas (odontogramas, pagos, tratamientos).

### Changed
- **PrivateLayout:**
    - Ahora incluye el componente `QuickAccessBar` como parte persistente del layout.
    - Ajustado el contenedor principal con `ml-[60px]` para alineación correcta del header y contenido.
- **Estilo general:**
    - Unificación de esquema visual en modo oscuro (`bg-dark`, `bg-secondary`, `text-slate-*`).
    - Homogeneización de bordes (`rounded-lg`) en componentes y botones.
- **Header:**
    - Cambio de la imagen de perfil a formato cuadrado.
    - Ajuste de espaciado y jerarquía visual entre secciones.

### Fixed
- Rutas relativas en imágenes de usuario que producían errores 404.
- Problema de solapamiento del sidebar sobre el header.
- Limpieza de listeners duplicados en eventos IPC (`AppRouter`).
- Sincronización correcta de estados de sesión y notificaciones al iniciar sesión.

---

## [0.1.0] - 2025-11-10
### Added
- **Estructura inicial del proyecto Electron + Vite + React.**
    - Configuración de `main`, `preload`, `renderer` y `shared`.
    - Integración de `electron-builder.yml`.
    - Base de carpetas:
        - `app/main` → proceso principal.
        - `app/renderer` → aplicación React.
        - `app/shared` → configuración compartida (`env.js`, `appInfo.js`).
- **TailwindCSS** configurado con `tailwind.config.js`.
- **Pantalla de login mock** con diseño base y campos funcionales.

---

