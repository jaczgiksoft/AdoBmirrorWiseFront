# 📑 CHANGELOG - BWISE Dental Desktop (Electron)

Todos los cambios relevantes del proyecto serán documentados aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

# [0.29.0] - 2026-02-06

### Added
- Soporte completo para **TADs (Temporary Anchorage Devices / Microimplantes)** en el odontograma clínico:
  - Nuevo modo **“Colocar TADs”** en el panel de acciones.
  - Colocación de TADs **en espacios interdentales** (no sobre dientes).
  - Uso del asset SVG clínico:
    - `assets/images/odontogram/tad.svg`
  - Representación independiente del diente (modelo clínico correcto).

- Implementación de **zonas interproximales interactivas**:
  - Zonas invisibles renderizadas entre dientes adyacentes.
  - Activación solo cuando el modo TAD está habilitado.
  - Highlight visual y cursor de acción en modo colocación.
  - Hit-box ampliado para mejor precisión clínica.

- Integración de **modo exclusivo de acción clínica**:
  - Exclusividad entre:
    - Colocación de Brackets
    - Colocación de TADs
  - Prevención de conflictos de interacción.

- Nuevo botón global **“Limpiar odontograma”**:
  - Disponible siempre en el ActionPanel.
  - Confirmación mediante componente existente:
    - `components/feedback/ConfirmDialog.jsx`
  - Restablece completamente el odontograma a su estado inicial:
    - Elimina TADs.
    - Elimina brackets.
    - Limpia oclusales.
    - Restablece todos los dientes a su estado base.
    - Reinicia contadores y estados derivados.

- Mejora visual en el módulo de **Extracciones**:
  - Sustitución de la “X” genérica por **SVGs clínicos específicos por diente**.
  - Uso de assets dedicados:
    - `assets/images/odontogram/extraction/*`
  - Correspondencia correcta por número y orientación dental.

---

### Changed
- Refinamiento visual del render de TADs:
  - Ajuste de tamaño relativo basado en el espacio interdental.
  - Escalado visual sin modificar el layout ni el spacing dental.
  - Centrado preciso en la zona gingival:
    - Maxilar: ligeramente superior al centro.
    - Mandíbula: ligeramente inferior al centro.

- Mejora del layout vertical en el **Odontograma de Elásticos**:
  - Separación clara entre maxilar y mandíbula mediante offsets verticales.
  - Eliminación de solapamientos visuales.
  - Mayor legibilidad en contexto de instrucciones clínicas.

- Refinamiento visual del ActionPanel:
  - Rediseño de checkboxes clínicos:
    - Estilo personalizado.
    - Apariencia moderna y profesional.
    - Integración visual con el tema oscuro.
  - Se evita explícitamente el uso de switches.

---

### Fixed
- Corrección de limitaciones visuales al escalar elementos clínicos:
  - Eliminación de intentos de escalado por `width/height` en espacios constreñidos.
  - Uso correcto de escalado visual (`transform`) cuando aplica.

- Corrección de alineaciones verticales inconsistentes:
  - TADs ahora centrados correctamente en la encía.
  - Mejor balance visual entre dientes, brackets y microimplantes.

- Eliminación de interacciones conflictivas entre modos clínicos:
  - Clicks en dientes deshabilitados correctamente durante colocación de TADs.

---

### Notes
- Este release consolida el **modelo clínico avanzado del odontograma**:
  - Brackets → pertenecen al diente.
  - TADs → pertenecen al espacio interdental.
- El odontograma queda preparado para futuras extensiones:
  - Movimiento / reposicionamiento de TADs.
  - Tipos de microimplantes.
  - Persistencia backend de estados clínicos.
  - Undo clínico global.
- No se incluye aún persistencia backend para TADs o extracciones.

---

# [0.28.0] - 2026-01-13

### Added
- Nuevo **módulo de Instrucciones de Elásticos** integrado al expediente del paciente:
  - Sección **Elastics** dentro del detalle del paciente.
  - Listado inicial de instrucciones registradas (mock data).
  - Flujo dedicado para creación de nuevas instrucciones mediante modal.

- Nuevo **modal de Registro de Instrucción de Elásticos**:
  - Layout clínico completo preparado para lógica avanzada.
  - Secciones claramente delimitadas:
    - Odontograma de Elásticos.
    - Acción a realizar (Bracket / Elásticos).
    - Detalles de la instrucción.
  - Campos disponibles:
    - Fecha de inicio.
    - Fecha de fin (opcional).
    - Tipo de elástico (texto libre por ahora).
    - Horas de uso por día.
    - Instrucciones adicionales.

- Implementación del **Odontograma de Elásticos (SVG)**:
  - Basado en el mismo diseño visual del odontograma principal.
  - Uso de **dientes base clínicos** con escala aumentada para mejor legibilidad.
  - Inclusión de etiquetas clínicas:
    - SUPERIOR (MAXILAR)
    - INFERIOR (MANDÍBULA)
    - IZQUIERDO / DERECHO
  - Espaciado y proporción ajustados para uso dentro de modal.

- Integración de **brackets reales** en el odontograma:
  - Uso del asset SVG existente:
    - `assets/images/odontogram/bracket.svg`
  - Estados visuales claros:
    - Bracket normal.
    - Bracket seleccionado.
    - Bracket origen del ciclo.
  - Feedback visual consistente con el odontograma clínico.

---

### Added — Interaction Logic
- Implementación de **lógica secuencial de selección de brackets** para elásticos:
  - Primer click define el **origen** del ciclo.
  - Clicks subsecuentes agregan puntos a la secuencia activa.
  - Click nuevamente en el origen **cierra el ciclo**.
  - Al cerrar:
    - El loop se guarda como instrucción lógica.
    - El estado activo se reinicia.
- Soporte para:
  - Un solo ciclo activo a la vez.
  - Múltiples ciclos completados por instrucción (persistencia lógica).

---

### Changed
- Refinamiento visual iterativo del odontograma de elásticos:
  - Ajuste real de escala de dientes (no solo del contenedor).
  - Reducción de espacio muerto dentro del SVG (`viewBox` y offsets).
  - Mejora de jerarquía visual en textos y numeración dental.
- Mejora en la claridad de textos de ayuda dentro del modal:
  - Instrucciones más explícitas para guiar la selección de puntos de anclaje.

---

### Fixed
- Corrección de confusión visual causada por:
  - Aumento de contenedor sin escalado de SVG interno.
- Alineación definitiva entre:
  - Tamaño de dientes.
  - Numeración.
  - Etiquetas clínicas.
- Eliminación de inconsistencias visuales entre:
  - Odontograma clínico.
  - Odontograma de elásticos.

---

### Notes
- Este release establece el **lienzo clínico definitivo** para el módulo de Elásticos.
- El odontograma queda **cerrado a nivel visual y estructural**.
- Se valida el modelo mental clínico de:
  - **Liga = ciclo cerrado de puntos de anclaje**.
- El sistema queda preparado para las siguientes etapas:
  - Dibujo de ligas (segmentos SVG).
  - Definición de ligas internas / externas.
  - Estilos por tipo de elástico.
  - Undo clínico por ciclo.
- No se incluye aún persistencia backend ni lógica de render de ligas.

---

# [0.27.0] - 2026-01-12

### Added
- Nuevo **módulo de Presupuestos** integrado al expediente del paciente:
  - Sección **Budgets** dentro del detalle del paciente.
  - Soporte completo para:
    - Creación, edición y eliminación de presupuestos.
    - Visualización de presupuestos históricos por paciente.
  - Modal de presupuesto reutilizable con flujo controlado.

- Integración con **Catálogo de Servicios**:
  - Selección de servicios mediante input filtrable (*Autocomplete*).
  - Auto-llenado de:
    - Descripción
    - Precio unitario
  - Cantidad editable por item.
  - Soporte para captura manual cuando no se selecciona un servicio.
  - Preparado para persistir *snapshot* de servicios.

- Integración opcional con **Planes de Tratamiento**:
  - Selector filtrable de planes existentes del paciente.
  - Auto-llenado de:
    - Título del presupuesto
    - Fecha de inicio
    - Duración
  - Presupuesto independiente si no se selecciona un plan.

- Nueva **capa financiera en Presupuestos**:
  - Cálculo dinámico de:
    - Total bruto
    - Pago inicial (monto fijo o porcentaje)
    - Descuento (monto fijo o porcentaje)
    - Subtotal financiable
    - Mensualidad según duración
  - Campos calculados en tiempo real para feedback inmediato al usuario.
  - Campos calculados en modo solo lectura.

- Nuevo componente reutilizable:
  - `AutocompleteInput`
  - Usado en:
    - Planes de Tratamiento
    - Presupuestos
  - Manejo seguro de:
    - catálogos vacíos
    - texto libre
    - normalización defensiva de datos

---

### Changed
- Eliminación total de **mock data** en la sección de Presupuestos.
- Conexión completa con la API real de Presupuestos:
  - Consumo de:
    - `GET /budgets/patient/:id`
    - `POST /budgets`
    - `PUT /budgets/:id`
    - `DELETE /budgets/:id`
- Normalización de datos provenientes de la API:
  - Conversión de valores numéricos (`DECIMAL`) a `number` en frontend.
  - Adaptación de estructuras de items para edición (`quantity`, `unit_price`).
- Refactor del flujo de edición de presupuestos:
  - Precarga correcta de items, totales y metadatos.
  - Manejo consistente de fechas (`start_date`).

---

### Fixed
- Corrección de errores de cálculo (`NaN`) causados por valores numéricos serializados como `string`.
- Corrección de errores de validación al crear/editar presupuestos:
  - Mapeo correcto de campos (`quantity`, `unit_price`).
  - Eliminación de IDs temporales del payload.
- Corrección del Autocomplete:
  - Prevención de errores por valores `undefined`.
  - Manejo seguro de catálogos vacíos.
- Corrección de carga de fechas en modo edición de presupuesto.

---

### Added — Business Rules
- Bloqueo de edición para presupuestos con estado **`approved`**:
  - Formulario en modo solo lectura.
  - Deshabilitación de inputs y acciones de guardado.
  - Indicador visual de estado aprobado.

---

### Notes
- Este release consolida el **Presupuesto** como entidad financiera real en la aplicación.
- Se establece una separación clara entre:
  - **Servicios** (plantillas de precio).
  - **Planes de Tratamiento** (contexto clínico).
  - **Presupuestos** (snapshot financiero).
- El frontend queda alineado con el backend para:
  - Cálculos financieros confiables.
  - Integración futura con pagos y facturación.
- El módulo queda preparado para:
  - Versionado de presupuestos.
  - Flujos de aprobación.
  - Conversión de presupuestos aprobados a ejecución clínica.

---

# [0.26.0] - 2026-01-12

### Added
- Nuevo **módulo de Planes de Tratamiento** integrado a la vista de Paciente:
  - Gestión completa de planes clínicos por paciente:
    - Creación de planes con título, fecha de inicio y duración.
    - Marcado de plan principal.
    - Eliminación de planes existentes.
  - Soporte para **tratamientos múltiples por plan** con:
    - Orden configurable mediante *drag & drop*.
    - Persistencia real vía API (sin uso de mock data).
    - Snapshot clínico independiente por tratamiento
      (`nombre`, `descripción`, `color`).

- Implementación de **catálogo dinámico de tratamientos**:
  - Autocomplete con búsqueda en tiempo real.
  - Capacidad de:
    - Seleccionar tratamientos existentes.
    - Crear tratamientos nuevos directamente desde el plan.
  - Crecimiento orgánico del catálogo basado en uso clínico real.

- Selector visual de color por tratamiento:
  - Integración de **color picker** para asignación manual.
  - Persistencia del color como parte del snapshot clínico.
  - Representación visual consistente en planes y listados.

- Nuevos servicios de integración con la API:
  - `treatmentPlan.service.js` para planes de tratamiento.
  - `process.service.js` para consumo de procesos clínicos.
  - `step.service.js` para consumo de pasos clínicos.

---

### Changed
- **Integración real frontend ↔ backend** en secciones de Paciente:
  - Eliminación de *mock data* en:
    - Planes de tratamiento.
    - Prescripciones.
    - Representantes.
    - Facturación.
  - Consumo directo de la API como fuente única de verdad.

- Refactor del módulo de **Citas**:
  - Ajustes en:
    - `AppointmentForm`
    - `AppointmentList`
    - `AppointmentsSection`
  - Alineación con cambios recientes en la API
    (procesos, estructura de respuesta, servicios).

- Mejoras en el **Calendario Clínico**:
  - Refinamiento de vistas:
    - Día
    - Mes
    - Agenda general
  - Mejor sincronización de eventos tras operaciones CRUD.
  - Optimización de render y experiencia visual.

- Ajustes globales de estilos:
  - Refinamiento de `index.css`.
  - Correcciones de contraste y legibilidad.
  - Mejor comportamiento en dark/light mode.

---

### Notes
- Este release introduce formalmente los **Planes de Tratamiento** como
  un componente clínico central dentro de la aplicación.
- Se completa la transición desde:
  - UI basada en *mock data*
  - hacia una aplicación **completamente integrada con la API**.
- La aplicación queda preparada para:
  - Visualizar planes clínicos junto a citas.
  - Integrar ejecución clínica futura (check-in, inicio y fin de tratamiento).
  - Métricas basadas en planificación vs ejecución real.

---

# [0.25.0] - 2026-01-06

### Added
- Nuevo **módulo de Citas Clínicas** en la aplicación Electron:
  - Flujo completo de **registro y edición de citas** mediante wizard guiado.
  - Separación clara por pasos:
    1. Datos principales de la cita.
    2. Selección de servicios con cálculo automático.
    3. Definición del **Proceso clínico** (mock inicialmente).
    4. Confirmación final en modo solo lectura.
  - Validaciones progresivas y sincronización automática de tiempos.

- Implementación de **agenda visual avanzada** para citas:
  - Vista de **Calendario Mensual** para planeación general.
  - Vista de **Calendario Diario por Área Clínica / Sillón** usando
    **Resource Time Grid**.
  - Representación de citas como fichas clínicas con:
    - Datos del paciente.
    - Doctor asignado.
    - Área clínica.
    - Duración y horario.
    - Color dominante basado en el servicio principal.

- Nuevo sistema de renderizado personalizado para eventos de calendario:
  - Uso de componentes propios (`CalendarEventCard`) en lugar de UI nativa.
  - Soporte completo para **dark / light mode**.
  - Separación entre layout del calendario y diseño visual de la ficha.

- Nuevos servicios de integración con la API:
  - `appointment.service.js` para consumo del módulo de citas.
  - `employee.service.js` para obtención de doctores elegibles para citas.
  - Extensión de `clinic_area.service.js` con endpoints ligeros para selects.
  - Extensión de `service.service.js` para uso en formularios clínicos.

- Integración del módulo de citas en la navegación general:
  - Registro del módulo en `modules.config.js`.
  - Enrutamiento dedicado en `AppRouter.jsx`.
  - Soporte para accesos rápidos y control de permisos.

---

### Changed
- Actualización del Dashboard y ruteo principal:
  - Soporte para alternar entre **vista de lista** y **vista de calendario** en citas.
  - Navegación coherente entre módulos administrativos y operativos.

- Mejora del comportamiento de actualización de datos:
  - El listado de citas y el calendario se sincronizan automáticamente
    tras crear o editar una cita.
  - Eliminación de la necesidad de recargar la aplicación manualmente.

- Ajustes visuales y de UX:
  - Manejo correcto de fondos y contrastes en calendario según dark/light mode.
  - Optimización del layout de fichas clínicas para distintas duraciones.

---

### Notes
- El módulo de Citas pasa de ser un formulario aislado a un **sistema operativo de agenda clínica**.
- La agenda visual queda alineada con flujos reales de clínica:
  - Organización por sillón.
  - Planeación diaria operativa.
- El soporte de **Procesos clínicos** se mantiene inicialmente como *mock data*,
  preparado para conectarse directamente con la API en el siguiente ciclo.
- Este release sienta la base para:
  - Seguimiento en tiempo real de citas.
  - Vistas especializadas por rol (recepción, doctor, asistente).
  - Integración futura de estados clínicos y métricas de atención.

---

# [0.24.0] - 2025-12-30

### Added
- Nueva **sección de Áreas Clínicas (Clinic Areas)** en la aplicación Electron:
  - Vista dedicada para listado, creación, edición y baja lógica de áreas de atención.
  - Gestión de recursos clínicos como sillones, áreas de tratamiento y salas especializadas.
  - Integración completa con la API reutilizando el patrón del módulo de **Servicios**.

- Implementación del **CRUD de Áreas Clínicas**:
  - Campo de nombre para identificación operativa del área.
  - Gestión de estado mediante enum:
    - Activa
    - En mantenimiento
    - Inactiva
  - Soporte para **soft delete**, alineado a la semántica administrativa del sistema.

- Integración del módulo en la navegación general:
  - Registro del módulo en `modules.config.js` para acceso desde el Dashboard.
  - Enrutamiento dedicado para áreas clínicas dentro de `AppRouter.jsx`.
  - Control de acceso basado en permisos (`clinic_areas`).

### Changed
- Se extendió el esquema modular del Dashboard:
  - Soporte explícito para catálogos clínicos adicionales sin cambios estructurales.
  - Reutilización completa del flujo de navegación y permisos existente.

### Notes
- **Áreas Clínicas** representa un recurso físico-funcional reutilizable que será utilizado por:
  - El módulo de **Citas**.
  - La agenda visual por área/sillón.
  - La asignación dinámica de pacientes en tiempo real.
- Este release se enfoca exclusivamente en la **gestión administrativa del recurso**, sin incluir aún lógica de agenda o disponibilidad.
- La UI mantiene coherencia visual, semántica y de experiencia con el resto de módulos administrativos.

---

## [0.23.0] - 2025-12-30

### Added
- Nueva **sección de Servicios Clínicos** en la aplicación Electron:
  - Vista dedicada para listado, creación, edición y baja lógica de servicios.
  - Integración completa con la API mediante **DataTable server-side**.
  - Soporte para paginación, ordenamiento y búsqueda remota.

- Implementación del **formulario de Servicios** con enfoque clínico-administrativo:
  - Definición de duración total del servicio.
  - Configuración de unidades sugeridas y valor por unidad para medir tiempo efectivo del doctor.
  - Precio base con formato orientado a importes monetarios.
  - Configuración operativa y fiscal (inventario, deducible, SAT, CFDI).

- Integración de **selector de color avanzado** para servicios:
  - Uso de librería especializada (`react-color`).
  - Selector visual con previsualización inmediata.
  - Persistencia del color como valor hexadecimal.

### Changed
- Se ajustó el **Dashboard** para renderizar módulos dinámicamente en función de:
  - Módulos habilitados por tenant.
  - Permisos del usuario autenticado.
  - Eliminación de dependencias hardcodeadas para nuevos módulos.

- Actualización semántica de acciones destructivas:
  - “Eliminar definitivamente” reemplazado por **“Dar de baja”** para reflejar correctamente el soft delete.
  - Mensajes de confirmación más claros y alineados al comportamiento real del sistema.

### Improved
- Mejora visual y de UX en formularios administrativos:
  - Inputs numéricos monetarios alineados a la derecha.
  - Símbolo `$` correctamente centrado verticalmente.
  - Eliminación de controles nativos (spinners) en inputs numéricos para mayor coherencia visual.
  - Reemplazo de checkboxes estándar por controles personalizados, modernos y consistentes con el tema dark.

- Optimización del **filtro de búsqueda en Servicios**:
  - Activación del filtrado solo a partir de **3 caracteres**.
  - Reducción de llamadas innecesarias a la API.
  - Comportamiento consistente con otros listados administrativos.

### Fixed
- Corrección del contrato de búsqueda entre Electron y API:
  - Uso estricto de `search.value` y `order[column, dir]`.
  - Filtrado correcto de resultados en búsquedas parciales.
  - Evita retornar registros no relacionados cuando hay texto de búsqueda.

### Notes
- Esta versión consolida el **módulo de Servicios** como pilar para:
  - Agenda clínica.
  - Medición de desempeño del doctor.
  - Implementación futura del módulo de Citas.
- La UI queda alineada visual y semánticamente con un entorno clínico-profesional.
- Base sólida para extender catálogos clínicos sin retrabajo de UX.

---

## [0.22.0] - 2025-12-29

### Added
- Nueva **sección de Odontograma** en el expediente del paciente con renderizado clínico por diente.
- Implementación de un **odontograma modular por SVG individual**, utilizando assets separados por tipo de diente.
- Soporte inicial para **tipos de diente dinámicos**, con arquitectura preparada para:
  - Diente base (original)
  - Tratamiento de endodoncia
  - Extracción
  - Diente ausente
  - Diente no erupcionado
  - Implante dental
  - Corona dental
  - Fisuras (completa, corona, raíz)
- Sistema de **cambio de estado por diente** mediante selección + clic, sin afectar otros dientes.
- **Contadores dinámicos** por tipo de diente, actualizados en tiempo real según el estado del odontograma.
- Resumen visual superior del odontograma con opción de mostrar solo tipos activos o el listado completo.

### Changed
- Refactor completo del odontograma para reemplazar el SVG monolítico anterior por una solución escalable y mantenible.
- Mejora en la distribución visual del maxilar y la mandíbula para una lectura clínica más clara.
- Ajustes de espaciado y escala para una mejor visualización de molares y zonas posteriores.

### Improved
- Se añadió un **modo de colocación de brackets**:
  - Activación mediante controles dedicados.
  - Colocación y retiro de brackets por diente (toggle).
  - Aplicación masiva de brackets a dientes sin bracket.
  - Posicionamiento clínicamente correcto del bracket sobre la corona (diferenciado entre maxilar y mandíbula).
- Preparación del odontograma para futuras extensiones clínicas sin necesidad de refactor estructural.
- Mejora general de UX manteniendo coherencia visual con el resto del expediente del paciente.

---

## [0.21.0] - 2025-12-28

### Added
- Nueva sección **Órdenes de Extracción** dentro del detalle del paciente.
- Implementación de un **wizard modal de 3 pasos** para el registro de órdenes de extracción:
  1. **Odontograma oclusal interactivo**
  2. **Carga de radiografías**
  3. **Datos clínicos y administrativos de la orden**
- Nuevo **odontograma oclusal dinámico**:
  - Soporte para selección por áreas (norte, sur, este, oeste, centro).
  - Diferenciación visual entre **Extracción** y **Tratamiento**.
  - Indicadores anatómicos (Superior, Inferior, Izquierdo, Derecho).
  - Numeración dual (dentadura permanente e infantil).
- Soporte para **carga múltiple de radiografías** con vista previa:
  - Drag & drop.
  - Límite de archivos configurable.
  - Eliminación individual antes de guardar.
- Integración completa con la API para:
  - Crear órdenes de extracción.
  - Editar órdenes existentes.
  - Eliminar órdenes (con confirmación).
  - Listar órdenes reales del paciente.

### Changed
- Se eliminó el uso de datos mock en la sección de Órdenes de Extracción, utilizando ahora información real proveniente del perfil del paciente.
- Se reutilizó el **mismo modal de registro** para creación y edición de órdenes de extracción.
- Se ajustó el diseño del wizard para mantener coherencia visual con el resto de secciones clínicas:
  - Estilos alineados con **Budgets**, **Gallery**, **Notes** y **Conversations**.
  - Botones estandarizados (primary / accent).
  - Soporte completo para **dark mode / light mode**.
- Se refinó el encabezado del modal:
  - Indicadores de pasos con progreso visual.
  - Animaciones sutiles y feedback visual consistente.
- Se unificó el manejo de fechas usando el mismo DatePicker utilizado en el formulario de pacientes.

### Fixed
- Se corrigieron errores en el envío de archivos al backend donde los radiographs no eran enviados como `File`.
- Se solucionó un fallo que impedía guardar restauraciones (tratamientos por áreas) al normalizar el payload del odontograma.
- Se corrigieron errores de estado nulo al procesar dientes sin selección previa.
- Se corrigieron errores de validación y rutas inexistentes al guardar ediciones de órdenes.
- Se mejoró la robustez del flujo de guardado evitando fallos silenciosos en órdenes con archivos.

### Improved
- Se mejoró significativamente la **experiencia clínica** al eliminar formularios manuales:
  - Todo el registro se realiza de forma visual e intuitiva.
  - Menor margen de error al seleccionar piezas dentales.
- Se fortaleció la coherencia del sistema:
  - Misma lógica de modales, confirmaciones y feedback visual que el resto de la aplicación.
- Se dejó preparada la interfaz para futuras mejoras:
  - Exportación de órdenes de extracción a PDF clínico.
  - Visualización detallada de órdenes históricas.
  - Estados avanzados (completada, cancelada, validada).

---

## [0.20.0] - 2025-12-14

### Added
- New **ConversationTimeline** component to render a unified patient conversation history.
- New **ConversationEntry** component to display individual conversation records within the timeline.

### Changed
- Refactored patient conversations section to use a **consolidated timeline view** instead of individual cards.
- Conversations are now displayed as a continuous **clinical log**, ordered by most recent entry first.
- Improved readability and context retention for doctors by presenting conversations as a single historical record.

---

## [0.19.0] - 2025-12-14

### Added
- Introduced new layout header components:
  - **PageHeader**: standardized header for main application pages.
  - **DetailHeader**: lightweight header for secondary and detail-level pages.

### Changed
- Patient filter dropdown updated to fully support **dark and light themes**, including:
  - Container, inputs, labels, and action buttons.
  - Consistent visual behavior across both themes.

---

## [0.18.0] - 2025-12-14

---

### Changed
- Updated branding to use a static BWISE logo across the application.
- Splash Screen now always displays the local BWISE main logo instead of tenant or placeholder logos.
- Login screen logo replaced with the local BWISE main logo for consistent branding.

### Fixed
- Corrected issues with Select inside Treatment Plan modal:
  - Dropdown content clipping inside scroll container is now flagged as a required fix (still pending).
  - Updated modal structure to prepare for complete overflow handling in next release.

---

## [0.17.0] - 2025-12-05

### Added
- Implemented full **Patient Budget Management** module (mock version for demo), including:
  - New **Budgets** section under Patient Detail, matching existing UI/UX patterns and keyboard shortcuts.
  - Modern, premium-style budget list with:
    - Status badges (Pending / Approved / Rejected)
    - Primary-accented totals and clean financial layout
    - Full light/dark theme support using project color variables from `index.css`
  - Complete **Budget Creation Flow**:
    - Modal with a refined “workspace” design
    - Editable list of budget items (description, qty, price)
    - Automatic subtotal, discount, total, and summary calculations
    - Status selector with themed badges
    - Support for adding/removing items dynamically
  - Keyboard shortcuts integrated across the module:
    - **N** → New Budget  
    - **ESC** → Close active modal  
    - **F5** → Refresh mock list  
  - Smooth animations via Framer Motion for:
    - Budget cards (fade-in, hover elevation)
    - Modal transitions (scale + opacity)
    - Optional micro-animations on status badges

### Improved
- Unified color usage across the Budgets module:
  - All colors migrated to project variables (`--color-primary`, `--color-bg`, `--color-text`, etc.)
  - Perfect alignment with existing clinical sections in both light and dark themes.
- Enhanced mock architecture for budgets:
  - Budget + BudgetDetail structure aligned with future API model (parent + child records)
  - Cleaner state management and item recalculation logic.

### Fixed
- Corrected inconsistencies in spacing, borders, and shadows during early prototype:
  - Cards and modals now follow the same elevation and radius standards as other modules.
- Resolved issues with keyboard shortcuts firing while modals were open.

---

## [0.17.0] - 2025-12-06

### Added
- Implemented full **Treatment Plan Management** module (mock version for demo):
  - New section under Patient Detail matching existing layout, logic, and keyboard shortcuts.
  - Modal for creating treatment plans with:
    - Title, start date, duration (months)
    - Main-plan toggle using shadcn `Switch`
    - Dynamic list of included treatments
  - Integrated **Treatment Catalog Select** using shadcn Select:
    - Automatically assigns predefined color + default description
    - Clean dropdown UI with color indicators
  - Added **drag-and-drop ordering** for treatments using `@dnd-kit`:
    - Sortable list with vertical drag handle
    - Smooth animations and stable behavior inside modal
    - Order persists in component state

### Improved
- Updated New Plan button styling:
  - Added hover color inversion (`bg-primary` + `text-white`) for proper contrast.
- Removed unnecessary **color input** in treatment items:
  - Color now comes exclusively from catalog metadata.
- Updated treatment item card layout:
  - Cleaner spacing
  - Consistent alignment with other clinical modules
  - Icon improvements for delete and expand controls

### Fixed
- Corrected issues with Select inside Treatment Plan modal:
  - Dropdown content clipping inside scroll container is now flagged as a required fix (still pending).
  - Updated modal structure to prepare for complete overflow handling in next release.

---

## [0.16.0] - 2025-12-05

### Added
- Implemented **advanced patient gallery system**, including:
  - Full image filtering (Facial, Oclusal, Intraoral, Radiographs, individual views).
  - Fullscreen **Comparison Viewer** supporting 1–3 images with:
    - Independent zoom & pan using react-zoom-pan-pinch
    - Keyboard navigation
    - Smooth modal transitions
  - Automatic **Cropper Modal** on image upload:
    - Zoom, rotate, crop, reset
    - Saves cropped output as Blob for API usage

- Added complete **New Gallery Creation Flow**:
  - Stepper workflow: Nombre → Fotos Clínicas → Radiografías
  - Drag-and-drop image upload per required slot
  - Optional X-ray upload system
  - Counters, validation, dynamic previews
  - Integrated cropper before saving images

### Improved
- Updated Gallery UI to use project primary theme color (`--color-primary: #00b8db`):
  - Buttons, selectors, pills, chips, highlights
  - Dark/light mode consistency
  - Cleaner spacing and typography alignment

- Enhanced **GalleryViewer**:
  - New sidebar with search + active collection highlight
  - Smooth transition between collections and images
  - Correct z-index handling to overlay global layout
  - Better fullscreen layout handling

- Improved **PatientDetail Splash Screen**:
  - Premium clinical gradient background
  - Central pulse loader with glow effects
  - Decorative top glow blending
  - **Dual synchronized ripple layers** on card border
  - Ripple animation synced with central pulse for medical-grade feel

### Fixed
- QuickAccessBar appearing above fullscreen viewer (z-index corrected).
- Layout overflow issues in fullscreen gallery comparison mode.
- Scroll and spacing inconsistencies when switching between collections.

---

## [0.15.0] - 2025-12-05

### Added
- Implemented **image filtering system** inside the Gallery Viewer, allowing doctors to:
  - Filter by category: Facial, Oclusal, Intraoral, Radiografías
  - Filter by specific photo position (e.g., Facial Front, Intraoral Center)
  - Reset to full gallery view  
  The grid now dynamically reflows based on the visible images without breaking layout.

- Added **Cropper Modal integration** to the gallery creation workflow:
  - When dragging or selecting an image, a full editing popup opens automatically.
  - Supports zoom, pan, rotate, flip, and constrained aspect ratio.
  - Saves the cropped image as a Blob for later upload.
  - Ensures consistent UI with PatientDetail dark/light themes.

### Changed
- Updated Gallery Viewer’s color system to use the project’s custom theme:
  - Replaced all Tailwind blue color utilities with `--color-primary: #00b8db`
  - Added new global utility classes in `index.css`:
    - `.text-primary`, `.bg-primary`, `.border-primary`, `.ring-primary`
    - Hover and opacity variants  
  The viewer now fully matches the clinic’s brand palette.

- Improved Cropper Modal UI:
  - Added `max-h-[90vh]` and internal scrolling to prevent overflow with tall images.
  - Footer now remains permanently visible regardless of image size.
  - Better spacing, alignment, and dark-mode contrast.

### Fixed
- Fixed layout overflow in the cropper when using tall/vertical images.
- Corrected inconsistent color usage in filters, buttons, and active states inside the Gallery Viewer.
- Ensured filter UI reflows gracefully on smaller screens or narrow widths.

### Improved
- Enhanced user experience inside Gallery Viewer:
  - Cleaner category segmentation
  - Faster perception of active filters
  - More intuitive grouping of photos
- Strengthened consistency across the Gallery module by applying:
  - Unified spacing scale
  - Theme-based color accents
  - Standardized interaction patterns

---

## [0.14.0] - 2025-12-05

### Added
- Implemented full **Gallery module** inside Patient Detail, including:
  - Gallery listing with folder-style cards
  - Search by name and sort by creation/modification date
  - Visual completeness indicator for required clinical photos
  - Mock dataset for initial UI/UX validation

- Added **Gallery Viewer** with:
  - Two-column layout (sidebar + content viewer)
  - Sidebar search, active collection highlighting, and quick collection switching
  - Keyboard navigation (← → to change collection, ESC to exit)
  - Full image lightbox with zoom and keyboard navigation
  - Support for both clinical photos and optional X-rays

- Added **Gallery Creator (Collection Wizard)**:
  - Multi-step creation flow (Name → Clinical Photos → X-Rays)
  - Modern dropzone-based uploader for all 8 required clinical photos
  - Optional X-ray uploader with add/remove/replace support
  - New compact and theme-aware Select component for collection naming
  - Integrated “New Gallery” action button in GallerySection

### Changed
- Gallery Viewer is now rendered at the **PatientDetailLayout** level to correctly cover:
  - Patient sidebar
  - Patient detail header
  - Patient section content  
  while preserving visibility of global header and quick-access bar.
- Updated the design of:
  - “New Gallery” button to match NotesSection styling
  - Save button (“Guardar Colección”) with project primary color (`#00b8db`)
  - Wizard stepper to a modern progress-rail design with animated states
- Improved spacing, dark-mode contrasts, and typography across creator and viewer screens.

### Fixed
- Resolved **React Hooks order error** caused by conditional viewer rendering inside sections.
- Fixed layout bleed where global header overlapped the viewer when using `fixed` overlays.
- Corrected select dropdown styling in dark mode to avoid default grey browser menu.
- Eliminated misalignment issues in the wizard header caused by oversized components.

### Improved
- Enhanced UX flow for creating a gallery:
  - Name can be selected at any point in the wizard
  - Immediate visual feedback when required photos are uploaded
  - Cleaner hierarchy and spacing in header and content areas
- Standardized component design across:
  - GallerySection
  - GalleryViewer
  - GalleryCreator
- Unified usage of `--color-primary (#00b8db)` for focus states, accents, and progress markers.

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

