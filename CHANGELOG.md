# 📑 CHANGELOG - BWISE Dental Desktop (Electron)

Todos los cambios relevantes del proyecto serán documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [0.13.0] - 2025-12-04

### Added
- Implemented full **Conversations module**, including:
  - CRUD operations with API integration
  - Modal for creating and editing conversations
  - Unified search + filter popover UI
  - Hotkeys (F1 focus search, F2 create, F5 save, ESC close)
  - Conversation cards with author, date, and actions

- Implemented **employee-based author display** for:
  - Notes
  - Conversations  
  Both modules now show the employee's full name and avatar instead of the username.

### Changed
- Updated Notes and Conversations card footers to display:
  - `employee.first_name + employee.last_name`
  - Employee profile image (fallback to icon)
- Updated filter components to match the unified design used in PatientList.
- Updated services (`patientNotes.service.js`, `patientConversations.service.js`) to return raw API arrays instead of accessing `response.data.data`.

### Fixed
- Resolved issues where:
  - Empty lists caused `.filter` errors due to undefined state.
  - Popover filters were visually detached from the search bar.
  - Incorrect includes caused missing employee data in card footers.
  - Conversations were not rendering due to incorrect service response handling.

### Improved
- Standardized UI components across:
  - NotesSection
  - ConversationsSection
  - FilterPopover  
- Enhanced initial loading state and safe fallback rendering to avoid UI crashes.

---

## [0.12.0] - 2025-12-04

### Added
- Implemented **HobbiesSection** with full real API CRUD integration.
- Implemented **PrescriptionsSection** with full real API CRUD integration.
- Added keyboard shortcut support across sections:
  - **F1** → Focus filter input  
  - **F2** → Create new item  
  - **Enter / F5** → Save modal  
  - **ESC** → Close with ConfirmDialog when dirty  

### Updated
- Enhanced **AlertsSection**, which continues to use **real API data**, maintaining consistency in UI and behavior.
- Improved **ContractsSection** and **AppointmentsSection** (citas) UI to match other sections.
- Added filtering input to **Contracts** and **Prescriptions**, aligned with PatientList behavior.
- Standardized modal validation (required fields, red indicators, toast messages) across all sections.

### Current Data Sources
- **Alerts** → Real API  
- **Hobbies** → Real API  
- **Prescriptions** → Real API  
- **Contracts** → Mock (planned API integration later)  
- **Appointments (Citas)** → Mock (awaiting backend module)

### Fixed
- Corrected shortcut behavior so F5 only triggers saves in the relevant open modal.
- Fixed ESC logic in modals so ConfirmDialog appears consistently when fields are dirty.
- Eliminated cross-module shortcut event leaks between hobbies and prescriptions.

---

## [0.11.0] - 2025-11-24

### Added
- **Nuevo módulo de Detalles del Paciente totalmente reorganizado:**
    - Separación completa del archivo `PatientDetail.jsx` en una arquitectura modular:
        - `PatientDetailLayout.jsx`
        - `PatientSidebar.jsx`
        - `index.jsx` como entrypoint limpio
        - Carpeta `/sections` con secciones independientes:
            - Summary, General, BillingData, Representatives, ClinicalHistory, Appointments, Notes, Contracts, Hobbies, Family, Prescriptions, Odontogram, TreatmentPlan, Elastics.
        - Carpeta `/components` con piezas reutilizables (HeaderInfo, AlertCard, ClinicalMiniDashboard, RepresentativeCard).
    - Primera versión de una **estructura escalable tipo “EHR premium”** para futuras expansiones.

- **Nueva pantalla Splash de espera:**
    - Imagen agregada: `splash-waiting.png`.
    - Se muestra mientras carga el perfil del paciente.
    - Adaptada a modo claro/oscuro.

- **Nuevas secciones funcionales iniciales:**
    - **SummarySection** con KPIs y mini-dashboard.
    - **GeneralSection** con datos personales, edad (años + meses) y estado civil.
    - **BillingSection** con tarjetas fiscales y tooltip para correos extensos.
    - **RepresentativesSection** integrada con el módulo de reps del formulario.
    - **ClinicalSection** con minidashboard clínico.
    - Estados vacíos estandarizados entre secciones.

### Changed
- **Refactor general del módulo de Pacientes:**
    - Archivos reubicados en estructura más lógica:
        - Componentes compartidos movidos a `/shared`.
        - Componentes dedicados movidos a `/PatientDetail`.
    - PatientAgeChart, PatientDashboard, modales y listas migrados a `/shared` para uso en futuras vistas.

- **Mejoras generales de UI/UX del Patient Detail:**
    - Layout tipo “Panel izquierdo + cuerpo derecho”.
    - Navegación suave con `useOutletContext`.
    - Fondo, sombras, espaciados y jerarquía visual modernizados.
    - Interfaz más coherente con diseño clínico premium.

- **Tooltip elegante para emails largos en BillingSection:**
    - Truncado automático del correo.
    - Tooltip moderno compatible con Light/Dark.

- **Ajustes menores visuales y de navegación:**
    - Header corregido.
    - Ajustes de CSS global (`index.css`) para espaciados, tipografía y colores.
    - Sidebar refinado para alineación con el layout de detalles.

### Fixed
- Correcciones en pasos del PatientDetail que no refrescaban la selección activa.
- Problemas de render entre sidebar y sección activa.
- Imagen `splash-waiting.png` que no coincidía con la versión final (archivo actualizado).
- Inconsistencias visuales entre secciones (bordes, paddings y sombras).

---

## [0.10.0] - 2025-11-21

### Added
- **Tooltip moderno en los tipos de paciente (PatientList.jsx):**
    - Cada cuadrito de tipo ahora muestra un tooltip elegante con el nombre completo del tipo.
    - Compatible con temas Light/Dark.
    - Tooltip responsivo, con sombras suaves y colores clínicos.

- **Indicador visual de “NUEVO” en la tarjeta del paciente (PatientList.jsx):**
    - Se agregó una insignia verde “NUEVO” en la esquina superior izquierda.
    - Solo aparece en pacientes creados hoy (`createdAt`).
    - Totalmente compatible con Light/Dark Mode.

### Changed
- **Actualización del render de fotos del paciente:**
    - Ahora las fotos se cargan correctamente usando `API_BASE` + `photo_url`.
    - Se asegura compatibilidad con rutas relativas del backend (`uploads/...`).
    - Mejora de fallback al ícono de usuario cuando no existe foto.

- **Orden por defecto del listado de pacientes:**
    - El backend ahora retorna los pacientes en orden descendente (`createdAt DESC`)
      cuando el frontend no envía columnas de ordenamiento.
    - Mantiene compatibilidad con ordenamiento personalizado enviado desde el front.

### Fixed
- Se corrigió un detalle donde `photo_url` guardaba rutas absolutas en Windows.
    - Ahora solo se almacena una ruta relativa (`uploads/...`), compatible con API_BASE.
- Se corrigió el cálculo de `isToday()` en PatientList y validación del flag de nuevos pacientes.

---

## [0.9.0] - 2025-11-21

### Added
- **Nuevo módulo de Representantes Legales (Paso 3 del `PatientForm.jsx`):**
    - Integración completa para administrar los responsables directos del paciente:
        - `PatientRepresentativeModal.jsx` → creación y edición.
        - `PatientRepresentativeList.jsx` → visualización, edición y eliminación.
    - Manejo en frontend alineado al modelo real del backend:
        - `full_name`
        - `relationship` (select fijo: Padre, Madre, Tutor, Abuelo(a), Hermano(a), Tío(a), Otro)
        - `phone`, `phone_alt`, `email`
        - `address`
        - Acceso al portal (`can_login`, `username`, `password`)
    - Generación automática de:
        - **temp_id** único por representante.
        - **username/password = phone** cuando `can_login = true`.
    - Modal totalmente integrado con:
        - Hotkeys (`ESC`, `Enter`).
        - Autofocus.
        - Comportamiento consistente con el wizard multipaso.
        - Limpieza automática del formulario al guardar o crear nuevo representante.

- **Nuevo diseño profesional del modal de representante:**
    - Soporte completo para **Light/Dark Mode**.
    - Inputs, select, toggle, acciones y contenedores adaptados a ambos temas.
    - Toggle para acceso al portal con animación y estilos coherentes.
    - Despliegue dinámico de credenciales con campos bloqueados pero visibles.

- **Nueva lista visual de representantes (`PatientRepresentativeList.jsx`):**
    - Tarjetas limpias con:
        - Nombre completo.
        - Relación.
        - Teléfono(s).
        - Email.
        - Indicador visual de acceso al portal.
    - Botones de **Editar** y **Eliminar** con variantes duales (light/dark).
    - Layout responsivo configurable a 1, 2 o 3 columnas.

### Changed
- Reemplazo del comportamiento previo del Paso 3 por un sistema completo de gestión:
    - Ya no es un placeholder; ahora es un módulo real.
    - Mejor organización del panel con bordes, sombras y fondo adaptado a ambos temas.
    - Mejor alineación visual con el diseño de los pasos 1, 2, 4 y 5.
    - Consistencia total con los nuevos estándares UI/UX del formulario multipaso.

### Fixed
- Se corrigió el problema donde al editar un representante y luego crear uno nuevo, el modal conservaba los datos anteriores.
    - Ahora el formulario se **reinicia correctamente** después de guardar o al crear un representante nuevo.
- Eliminación del bug que impedía regenerar un `temp_id` único al iniciar un nuevo registro.
- Validaciones internas corregidas (correo, teléfono requerido cuando `can_login = true`).

---

## [0.8.0] - 2025-11-21

### Added
- **Soporte completo de Light/Dark Mode en el módulo de Alertas del paciente:**
    - **`PatientAlertModal.jsx`:**
        - Adaptación total del modal a ambos temas (fondos, bordes, textos y sombras).
        - Nuevo diseño visual de toggle *administrativa / clínica* compatible con tema claro y oscuro.
        - Inputs, textarea y acciones actualizados para respetar el sistema UI del wizard principal.
        - Todos los elementos (labels, botones, contenedor, íconos) ahora responden correctamente al modo seleccionado.

    - **`PatientAlertList.jsx`:**
        - Nuevo esquema visual para alertas con tarjetas diferenciadas:
            - **Amarillas** → alertas **administrativas**.
            - **Rojas** → alertas **clínicas / generales**.
        - Fondos, bordes y texto adaptados para light/dark.
        - Tooltip administrativo modernizado y compatible con ambos temas.
        - Botones de editar y eliminar rediseñados con variantes duales.
        - Espaciados y contraste ajustados para mejor lectura en el panel del Paso 4.

### Changed
- Reemplazo completo del estilo previo de `PatientAlertList.jsx` por un diseño profesional:
    - Mejor estructura visual.
    - Colores con significado claro.
    - Sombra y borde acordes al diseño clínico.
    - Cohesión con los paneles de contenido del wizard multipaso.

- Ajustes en `PatientAlertModal.jsx` para alinear su estilo al nuevo estándar del formulario:
    - Uso de `bg-white / dark:bg-secondary`.
    - Bordes `border-slate-300 / dark:border-slate-700`.
    - Botones coherentes con el diseño del wizard.

### Fixed
- Tooltip administrativo que no era legible en modo oscuro.
- Bordes amarillos y rojos demasiado saturados al usar variaciones fijas sin soporte dark.
- Botones de acción con colores incorrectos para el modo claro.
- Contraste insuficiente en títulos de tarjetas (alertas administrativas y clínicas).

---

## [0.7.0] - 2025-11-21

### Added
- Soporte completo para **Light/Dark Mode** en el formulario multipaso (`PatientForm.jsx`):
    - Fondos, bordes, tipografías y hovers ahora se adaptan correctamente a ambos temas.
    - Integración en todos los pasos, modales internos y selects.
    - Ajustes visuales en foto del paciente, secciones y paneles.

- Nuevo comportamiento del modal estilo “Bootstrap”:
    - **Header fijo (sticky)**.
    - **Footer fijo (sticky)**.
    - **Contenido central scrolleable**, evitando que se pierdan los controles al desplazarse.
    - Corrección de `overflow-hidden` y `overflow-y-auto` para un scroll suave y sin saltos.

- **StepTabs ahora también son sticky**:
    - Barra de pasos permanece visible bajo el header.
    - Mejora la navegación en pasos largos (especialmente en el Paso 1).

- Mejoras visuales del indicador activo del paso:
    - Ajustes al *pulse ring* para que funcione en modo claro y oscuro.
    - Mejor contraste y visibilidad del número del paso.

### Changed
- Ajustes de colores en StepTabs para mejor legibilidad en modo claro:
    - Actualización de hovers de título y descripción.
    - Reemplazo de colores muy claros que reducían contraste.
    - Se homogenizó el estado inactivo para ser legible tanto en claro como en oscuro.

- Mejora del hover en títulos y descripciones del StepTab:
    - Ahora el hover aplica correctamente aunque se pase el cursor por el número o la descripción.
    - Evita estados poco visibles en tema claro.

- Ajustes generales de espaciados y bordes en el formulario para coherencia visual completa con el nuevo modo dual.

### Fixed
- *Pulse ring* del paso activo casi imperceptible en modo claro.
- Hover del título del paso difícil de leer en modo claro.
- Fondo del área scrolleable que no coincidía con el tema seleccionado.
- Bordes y sombras inconsistentes entre pasos al alternar entre temas.

---

## [0.6.2] - 2025-11-21

### Added
- **Nuevos campos de dirección en el formulario de registro de pacientes (`PatientForm.jsx`):**
  - Se añadió una sección completa de dirección dentro del **Paso 1 – Información general**, ubicada después de los campos de teléfono y correo.
  - Campos agregados, todos enlazados al modelo del backend y soportados por validación:
    - `address_street_name`
    - `address_street_number`
    - `address_apartment_number`
    - `address_neighborhood`
    - `address_zip_code`
    - `address_city`
    - `address_state`
    - `address_country`
  - Diseño limpio y consistente con el wizard:
    - Agrupación en grids de 2 columnas.
    - Subtítulo “🏠 Dirección” con jerarquía visual.
    - Placeholders descriptivos y formato homogéneo con `.input`.
  - Totalmente integrado al `initialForm`, `handleChange`, validación de paso y `payload` final enviado al API.

### Changed
- Ajuste del diseño del Paso 1 para mantener legibilidad y espaciados al añadir la nueva sección de dirección.
- Uniformidad visual del formulario con la estructura del wizard multipaso.


---

## [0.6.1] - 2025-11-20

### Added
- **Nuevo módulo clínico `Referrals`** (`referrals`):
  - Permite registrar las fuentes de referencia del paciente (personas, empresas, campañas, otros médicos, etc.).
  - Modelo `referral.model.js` con soporte multi-tenant (`tenant_id`) y campos:
    - `name` (obligatorio, máx. 120)
    - `contact_name`, `contact_phone`, `contact_email`
    - `notes` (texto opcional)
  - Validación de email incluida (`isEmail`).
  - Índice único por tenant:
    ```sql
    unique (tenant_id, name)
    ```

- **Migración `create-referrals.js`**:
  - Crea tabla `referrals` con `paranoid: true` para soft delete.
  - Índices optimizados:
    - `tenant_id`
    - `name`
    - `contact_email`
    - `uq_referrals_tenant_name` (único)

- **Asociaciones agregadas en `associations.js`**:
  - `Tenant.hasMany(Referral, { as: 'referrals' })`
  - `Referral.belongsTo(Tenant, { as: 'tenant' })`
  - `Patient.belongsTo(Referral, { as: 'referral' })`

- **Repositorios y servicios del módulo**:
  - `referral.repository.js`:
    - CRUD básico: `findAll`, `findById`, `findByName`, `createReferral`, `updateReferral`, `deleteReferral`
    - Filtra automáticamente por `tenant_id`
  - `referral.service.js`:
    - Lógica de negocio con validación de duplicados por tenant
    - Manejo de errores consistente
    - Auditoría con `createLog` / `logApiError`

- **Controlador y rutas REST**:
  - `referral.controller.js`:
    - `GET /referrals` → listar todos
    - `POST /referrals` → crear
    - `PUT /referrals/:id` → actualizar
    - `DELETE /referrals/:id` → eliminar (soft delete)
  - `referral.routes.js` protegido con:
    - `validateToken`
    - `loadPermissions`
    - `checkPermissions('read' | 'write' | 'edit' | 'delete', 'referrals')`
    - `validateRequest`

- **Integración completa con el módulo de Pacientes**:
  - Se añade el campo `referral_id` al modelo `patient.model.js`
  - En la creación/actualización de pacientes ya se admite asignar un referidor
  - Nuevos includes en:
    - `patient.repository.js` (include: { model: Referral, as: 'referral' })
    - `patient.controller.js`, `patient.service.js` para entregar datos completos

### Changed
- Revisión de validadores de paciente (`patient.validator.js`) para permitir `referral_id` como campo opcional.
- Ajustes en `patient.routes.js` y `patient.controller.js` para aceptar la propiedad sin romper compatibilidad previa.
- Se documenta en código la relación clínica “Patient → Referral”.

### Notes
- Este módulo permite construir métricas internas como:
  - Principales fuentes de referidos
  - Efectividad por campaña o canal
  - Ranking de médicos o empresas que envían pacientes
- Compatible con auditoría, soft delete y multi-tenant.
- 
---

## [0.5.1] - 2025-11-21

### Added
- **Nuevo Datepicker en el Paso 1 (`PatientForm.jsx`)**
  - Integrado `react-tailwindcss-datepicker` en el campo “Fecha de nacimiento”.
  - Soporte para formato `YYYY-MM-DD`.
  - Campo en modo `readOnly` con estilo unificado a `.input`.
  - Localización en **español** (`i18n="es"`).
  - **Fecha máxima = hoy** para evitar selección futura.
  - Se conserva el cálculo de edad dinámico junto al label.

- **Nuevo catálogo de Referidores**
  - Carga automática vía `getReferrals()` al abrir el formulario.
  - Nuevo select **“Referido por”** ubicado junto al campo “Estado civil”.
  - Integración completa con backend mediante `referral_id`.

### Changed
- **Ajustes globales de estilos**
  - Fix a `.opacity-1` para corregir opacidad incorrecta generada por Tailwind (antes 1% → ahora 100%).
    ```css
    .opacity-1 {
        opacity: 1 !important;
    }
    ```
  - Mejor compatibilidad visual del datepicker con el tema oscuro de la aplicación.

- **Mejoras de UX dentro del modal**
  - Se evita que el calendario empuje el contenido del modal hacia abajo.
  - Se corrige la interacción del popup dentro del wizard.
  - Mejor soporte para el esquema visual clínico de BWISE.

### Fixed
- Problema donde el calendario aparecía **casi invisible** debido a una regla errónea de opacidad.
- Fondo blanco incorrecto del datepicker cuando la app está en modo oscuro.
- Ajuste del contenedor del datepicker para evitar desplazamiento interno no deseado.

---

## [0.5.0] - 2025-11-20

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

## [0.4.0] - 2025-11-20

### Added
- **Soporte completo de navegación por teclado en `PatientList.jsx`:**
    - ↑ / ↓ → Mover selección entre tarjetas.
    - Enter → Abrir expediente del paciente seleccionado.
    - Delete → Eliminar paciente seleccionado.
    - ESC → Regresar al dashboard.
    - ← / → → Cambiar página.
    - F12 → Abrir el modal de selección de tipo de paciente.

- **Nuevo componente `PatientTypeSelectorModal.jsx`:**
    - Modal independiente para elegir: **Prospecto** / **Consulta Única**.
    - Diseño consistente con el estilo clínico.
    - Soporte de navegación por teclado:
        - ↑ / ↓ para moverse entre opciones.
        - Enter para confirmar selección.
        - ESC para cancelar.
    - Comportamiento completamente independiente sin interferir con `PatientList`.

- **Mejoras en `PatientForm.jsx`:**
    - Aislamiento total de hotkeys del wizard.
    - Prevención de conflictos con el listado o con el modal de tipo.
    - Comportamiento correcto de `ESC`, `Enter` y `F5`.
    - Validación por paso totalmente funcional.
    - Eliminación de warning crítico: *Rendered more hooks than during the previous render*.

### Changed
- **Refactor estructural del sistema de hotkeys (`useHotkeys`) en el módulo de Pacientes:**
    - Cada componente ahora maneja solo sus propios atajos.
    - Se eliminaron duplicados y listeners residuales.
    - Los atajos del listado ya no se ejecutan cuando:
        - Está abierto el wizard.
        - Está abierto el modal de tipo de paciente.
        - Está activo un diálogo de confirmación.
    - Navegación más clara, estable y predecible.

- **Flujo corregido de creación de nuevo paciente:**
    - F12 ya **no abre directamente el formulario**, sino el **modal de tipo**.
    - El wizard solo se abre después de elegir el tipo.

- **Mejoras de UX en la interacción con modales:**
    - Ningún atajo del listado afecta al modal de registro.
    - Delete ya no puede disparar eliminaciones mientras el formulario está abierto.

### Fixed
- Problema donde F12 abría el formulario ignorando el modal de tipo.
- Conflicto donde `Delete` pedía eliminar paciente incluso con el formulario abierto.
- Hotkeys del formulario bloqueando el listado incluso cuando estaba cerrado.
- Listeners huérfanos que seguían activos después de cerrar modales.


---

## [0.3.2] - 2025-11-20

### Added
- **Autogeneración del número de expediente (PatientForm.jsx):**
    - Integración con el endpoint `GET /patients/next-medical-record`.
    - Carga automática del expediente al abrir el formulario.
    - Bloqueo del campo para evitar edición manual.
    - Preparado para futura adaptación según formato oficial del doctor.

- **Autogeneración de código familiar:**
    - Nuevo generador aleatorio alfanumérico de 6 caracteres.
    - Código amigable, no secuencial y no deducible.
    - Se asigna automáticamente al abrir el wizard.
    - Mantiene independencia del número de expediente y del tenant.

- **Tipo de paciente visible en el encabezado del formulario:**
    - El formulario ahora muestra:  
      `Registrar nuevo paciente — Prospecto`  
      `Registrar nuevo paciente — Consulta única`.

### Changed
- **Wizard dinámico según tipo de paciente (PatientForm.jsx):**
    - Prospecto conserva los 5 pasos tradicionales.
    - Consulta única ahora muestra solo los pasos: **1, 2 y 4**.
    - Navegación entre pasos ajustada para respetar únicamente los pasos permitidos.
    - Reenumeración visual correcta en los tabs (1–3) para Consulta Única.

- **Mejoras UX en la etapa de Información General (Paso 1):**
    - Labels mejorados con placeholders en campos clave.
    - Preparación del diseño para cálculo de edad dinámico junto a “Fecha de nacimiento”.

### Fixed
- Corrección del orden de rutas en `patient.routes.js` para evitar que  
  `/patients/:id` capture la ruta `/patients/next-medical-record`.
    - El endpoint ahora funciona sin colisiones con el validador de ID.


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

