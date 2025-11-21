# 📑 CHANGELOG - BWISE Dental Desktop (Electron)

Todos los cambios relevantes del proyecto serán documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [3.3.0] - 2025-11-20

### Added
- **Sistema completo de Alertas del Paciente (Paso 4 del formulario):**
    - Nuevo componente `PatientAlertModal.jsx`:
        - Modal moderno para **crear y editar alertas** con:
            - Título
            - Descripción
            - Indicador administrativo (`is_admin_alert`)
        - **Limpieza automática** del formulario al guardar o crear nueva alerta.
        - Autofocus y comportamiento consistente con el wizard multipaso.
    - Nuevo componente `PatientAlertList.jsx`:
        - Tarjetas limpias y profesionales para mostrar las alertas registradas.
        - **Layout responsivo** en 3 o 4 columnas según resolución.
        - Acciones (editar / eliminar) alineadas en esquina superior derecha.
        - Indicador visual para alertas administrativas con tooltip “Administrativa”.
    - Integración en `PatientForm.jsx`:
        - Gestión completa del estado local `alerts` (agregar, editar, eliminar).
        - Modal reutilizable para creación y edición.
        - Persistencia de alertas dentro del payload final de creación del paciente.

- **Nuevo diseño del Paso 4 — Alertas del paciente:**
    - Sección reconstruida como un **módulo interno** dentro del wizard:
        - Encabezado grande con icono ⚠️ y descripción contextual.
        - Botón “Nueva alerta” con estilo ghost/primario, coherente con la UI.
        - Estado vacío elegante con ícono grande, texto guía y CTA.
    - Panel dedicado:
        - Fondo translúcido (`bg-slate-800/40`), bordes y sombra interna.
        - Organización clara del contenido y mayor jerarquía visual.

### Changed
- Reemplazo completo del diseño previo del Paso 4 por una versión **mucho más refinada, moderna y estructurada**.
- Mejor alineación visual entre tabs del wizard y paneles internos.
- Consistencia reforzada en tipografías, espaciados, botones y sombras en el módulo de alertas.

---

## [0.3.2] - 2025-11-18

### Added
- **Formulario multipaso completo para registro de pacientes (`PatientForm.jsx`):**
  - 5 pasos organizados:
    1) Información general
    2) Información fiscal
    3) Representantes legales
    4) Alertas del paciente
    5) Acceso móvil
  - Sistema de navegación entre pasos con botones "Atrás" y "Siguiente".
  - Validaciones por paso y prevención de avance si hay errores.
  - Visualización moderna del formulario dentro de modal tipo wizard.

- **Nuevo sistema visual de tabs para pasos:**
  - Números a la izquierda con diseño compacto.
  - Indicador animado del paso activo.
  - **Efecto de “pulse ring”** alrededor del número del paso activo.
  - Línea inferior destacando el tab seleccionado.
  - Hover suave y coherente con la UI oscura.

- **Selección inicial del tipo de paciente:**
  - Modal previo que pregunta si el paciente será **Prospecto** o **Consulta Única**.
  - Identificador del tipo cargado automáticamente en `patient_type_ids`.

- **Modal ampliado al 80% del ancho de la pantalla:**
  - Nuevo diseño más cómodo para formularios amplios.
  - Ancho responsivo con `max-w-[1100px]`.

- **Mejoras en la captura de foto:**
  - Vista previa inmediata (`photo_preview`).
  - Soporte para archivo local con fallback de ícono.

### Changed
- **Reestructuración interna del formulario de pacientes:**
  - Sustituido el modal único por un wizard multipaso.
  - Código reorganizado para facilitar integración futura con endpoints reales.
  - Diseño refinado y consistente con el estilo clínico del sistema.


---

## [0.3.1] - 2025-11-18

### Added
- **Reestructuración completa del `Header.jsx`:**
    - Adaptación total al nuevo endpoint `auth/me`.
    - Eliminación de lógica de tiendas, cajas y sesiones (no aplican al módulo clínico).
    - Visualización moderna y compacta del tenant:
        - Logo, nombre, ciudad y estado.
        - Código del tenant, moneda, tipo de cambio (verde si existe, rojo si falta) y RFC.
        - Sitio web con acceso directo.
    - Roles múltiples mostrados como chips estilizados.
    - Foto de usuario cuadrada con fallback por defecto.
    - Barra secundaria informativa con fecha y hora, coherente con modo oscuro.

- **QuickAccessBar dinámica con soporte de permisos:**
    - Construcción automática a partir de `user.modules` y permisos `read`.
    - Se agregó el botón fijo de **Inicio**.
    - Cada módulo recibe un color armónico generado desde `helpers.js`.
    - Tooltip animado con nombre completo del módulo.
    - Sistema de **blacklist** para ocultar módulos no deseados (`auth`, `logs`, `roles`, `settings`, etc.).

- **Mejoras visuales en tipos de pacientes (`PatientList.jsx`):**
    - Ahora soporta múltiples `patient_types` por paciente.
    - Visualización compacta tipo “quick-access”:  
      cuadritos sólidos con iniciales y color correspondiente.
    - Ajuste responsivo que evita desalineación entre tarjetas.

- **Nueva utilidad en `helpers.js`:**
    - `generateHarmoniousColor()` para colores sólidos/armónicos.
    - `getContrastColor()` para determinar texto blanco/negro según el fondo.

### Changed
- **Actualización de `PatientList.jsx`:**
    - Ajuste de diseño para soportar varios tipos por paciente sin aumentar la altura de las tarjetas.
    - Limpieza de código y estandarización visual con el resto del sistema clínico.
    - Corrección del estado visual seleccionado y de los tooltips.

- **Mejor integración UI/UX general:**
    - Consistencia de colores, bordes y sombras en todos los módulos clínicos.
    - Comportamiento más predecible en búsquedas, navegaciones y tooltips.

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

