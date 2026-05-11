# WAXP

CMS visual con page builder drag & drop. Construye sitios web completos dibujando bloques sobre un CSS Grid, con soporte multi-idioma, soporte responsive completo, temas dark/light, tipografía responsiva y renderizado estático.

## Arquitectura

| Capa | Stack | Directorio |
|------|-------|------------|
| Frontend | Vue 3 + TypeScript + Vite Plus | `vuebo/` |
| Backend Admin | Go + Echo v5 + PostgreSQL | `echo/` (cmd/admin) |
| Backend Render | Go + Echo v5 + PostgreSQL | `echo/` (cmd/render) |

```
waxp/
├── vuebo/                  # Frontend — Vue 3 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/     # Page builder (bloques, secciones, overlay, settings)
│   │   │   └── manager/    # Gestión de sitios
│   │   ├── composables/    # Lógica reutilizable (drag, grid, bloques, tema...)
│   │   ├── stores/         # Estado global con Pinia
│   │   ├── types/          # Tipos TypeScript
│   │   ├── views/          # Vistas de la app
│   │   ├── router/         # Vue Router con rutas dinámicas
│   │   ├── i18n/           # Internacionalización + datos de referencia
│   │   ├── db/             # IndexedDB (Dexie)
│   │   ├── css/            # Estilos globales
│   │   └── assets/         # Recursos estáticos
│   └── docs/               # Documentación del frontend
├── echo/                   # Backend
│   ├── cmd/
│   │   ├── admin/          # Entry point — API REST backoffice
│   │   └── render/         # Entry point — Servidor de páginas públicas
│   ├── internal/
│   │   ├── admin/          # Setup servidor admin (rutas protegidas con JWT)
│   │   ├── renderer/       # Setup servidor render (solo lectura, sin auth)
│   │   ├── handler/        # HTTP handlers (auth, sites, pages, media, blocks...)
│   │   ├── render/         # Motor de renderizado HTML/CSS estático
│   │   ├── db/             # Código generado por sqlc
│   │   ├── filter/         # Sistema de filtros genérico para queries
│   │   ├── middleware/      # Auth JWT, CORS
│   │   └── config/         # Configuración desde env (AdminConfig / RenderConfig)
│   ├── db/
│   │   ├── migrations/     # Migraciones SQL
│   │   └── queries/        # Queries sqlc
│   └── project/            # Documentación del backend
└── README.md
```

---

## Page Builder

El editor visual permite construir páginas arrastrando bloques sobre un grid responsivo con 3 breakpoints independientes.

### Grid responsivo

| Viewport | Columnas | Filas por defecto | Gap |
|----------|----------|-------------------|-----|
| Desktop  | 24       | 12                | 12px|
| Tablet   | 20       | 12                | 8px |
| Mobile   | 8        | 12                | 8px |

Cada bloque almacena coordenadas independientes para los 3 breakpoints (`d`, `m`, `t`), permitiendo layouts completamente diferentes por dispositivo. El viewport se alterna en tiempo real desde la toolbar del editor.

### Sistema de bloques

Los bloques son unidades de contenido que se posicionan como hijos directos del CSS Grid mediante `grid-column` y `grid-row` con span. Usan `contain: size` + `overflow: visible` + `min-width/height: 0` para que el grid controle el tamaño independientemente del contenido.

**Tipos de bloque disponibles:**

| Tipo | Descripción |
|------|-------------|
| `Text` | Contenido multilenguaje con editor TipTap (bold, italic, headings, lists, tables, code, links...) |
| `Image` | Imagen responsiva con URLs por dispositivo, focal point, zoom y fit modes |
| `Button` | Botón con estilos completos: colores light/dark para bg, texto, bordes, hover, active, focus |
| `Icon` | Icono vectorial (Tabler Icons) con enlace, color y tamaño configurable |
| `Menu` | Menú de navegación jerárquico con items recursivos, fuentes por nivel y colores de estado |
| `Space` | Espaciador con divisor configurable (color, grosor, estilo de línea) |
| `DarkMode` | Toggle de tema dark/light con detección de preferencia del sistema |
| `LanguageSwitcher` | Selector de idioma que cambia el locale activo |

### Draw (dibujar bloques)

Dibujar bloques nuevos directamente sobre el grid arrastrando el cursor:

- **interact.js** captura el drag sobre la sección
- Conversión píxel → coordenadas de grid en tiempo real
- **Overlay visual** (`DrawingOverlay.vue`) muestra la selección semi-transparente
- Detección de colisiones: no permite dibujar sobre bloques existentes
- **Push-down** automático: si el nuevo bloque solapa otro, empuja el existente hacia abajo
- **Expansión de filas**: el grid crece automáticamente si el dibujo excede las filas actuales
- Throttle con `requestAnimationFrame` (máx. 1 actualización por frame, 60fps)

### Move (mover bloques)

Mover bloques arrastrando desde el handle `.blockui.move`:

- `transform: translate3d()` para feedback visual (GPU-acelerado)
- **cellHalf**: snapping simétrico desplazando el punto de detección al centro de la primera celda
- Shadow overlay muestra la posición destino mientras el bloque se mueve
- Resolución de colisiones y auto-posicionamiento en los otros breakpoints
- `trimRows` elimina filas vacías tras mover

### Resize (redimensionar bloques)

Redimensionar arrastrando los bordes derecho e inferior via `.blockui.resize`:

- **Live grid snapping**: actualiza las coordenadas reactivas en vivo — el bloque se reposiciona en el grid real en cada frame, sin usar `transform: scale()`
- Usa `event.rect` de interact.js (no `getBoundingClientRect()`) para dimensiones precisas
- cellHalf para snapping simétrico de tamaño
- Restricción mínima de 1x1 celda

### Estructura de datos del bloque

```typescript
interface Block {
  id: number
  type: string
  locales?: Record<string, string>      // Contenido traducible por locale
  d: BlockCoords                        // Desktop
  m: BlockCoords                        // Mobile
  t: BlockCoords                        // Tablet
  style: BlockStyle                     // Fondo, bordes, padding, margin
  color?: null | string                 // Color de texto (light)
  darkColor?: null | string             // Color de texto (dark)
  fontSize?: null | number              // Tamaño de fuente
  lineHeight?: null | number            // Altura de línea
  divider?: SideBorder                  // Línea divisoria (Space)
  image?: BlockImage                    // URLs de imagen por breakpoint
  link?: BlockLink                      // Capa de enlace (internal/external/anchor)
  button?: BlockButton                  // Estilos completos de botón
  icon?: BlockIcon                      // Nombre y strokeWidth del icono
  menu?: MenuItem[]                     // Items de menú (resuelto por locale)
  menuColors?: MenuColors               // Colores normal/hover/active × light/dark
  menuFont?: Font                       // Fuente nivel 1 del menú
  menuSubFont?: Font                    // Fuente subniveles del menú
  isMobileMenu?: boolean                // Marcado como menú móvil
}

interface BlockCoords {
  x: number    // Columna inicial (1-indexed)
  y: number    // Fila inicial (1-indexed)
  w: number    // Span de columnas
  h: number    // Span de filas
}
```

### Panel de opciones

Cada tipo de bloque tiene su panel de settings específico (`ButtonSettings`, `TextSettings`, `ImageSettings`, etc.) que se carga dinámicamente según el bloque seleccionado. Incluye:

- **Background**: color, imagen, gradiente con soporte light/dark, focal point, zoom
- **Bordes**: radius por esquina, bordes por lado (color, grosor, estilo)
- **Padding / Margin**: por lado
- **Fuente**: selector de Google Fonts con pesos y cursiva
- **Colores**: pickers independientes para light y dark
- **Enlace**: interno, externo o ancla
- **Ocultar en**: ocultar el bloque en breakpoints específicos
- **Campos reutilizables**: `ColorPicker`, `NumberRange`, `SectionRange`, `MediaPicker`, `FocalPointPicker`, `FontFamilyField`, `SidesField`, `TextField`

---

## Internacionalización (i18n)

### Sistema de locales del site

Cada site puede tener múltiples idiomas (locales). El contenido se almacena como un mapa anidado por locale en la base de datos y se resuelve al locale solicitado en la respuesta de la API.

**Almacenamiento en BD:**
```json
{ "locales": { "text": { "es": "<p>Hola</p>", "en": "<p>Hello</p>" } } }
```

**Respuesta API (`?locale=es`):**
```json
{ "locales": { "text": "<p>Hola</p>" } }
```

Los campos compartidos (estilos, colores, coordenadas) no se localizan — son iguales para todos los idiomas.

### UI del editor

El frontend usa **vue-i18n** con mensajes en `es` e `en` para la interfaz del editor. Se auto-importa desde `src/i18n/locales/`.

### Datos de referencia

Módulo independiente en `src/i18n/reference/` con nombres de idiomas (ISO 639-1, 184 entradas) y países (ISO 3166, ~249 entradas) traducidos a `es` e `en`. El composable `useReferenceData()` reacciona al locale actual de la app.

---

## Sistema de temas Dark/Light

- 3 modos: `light`, `dark`, `auto` (sigue la preferencia del sistema)
- Persistencia en `localStorage`
- Aplicación via `data-coreui-theme` en `<html>`
- Detección de sistema con `matchMedia('(prefers-color-scheme: dark)')`
- Evento custom `coreui-theme-change` para reaccionar a cambios
- Composable `useTheme()` con `isDark`, `isLight`, `isAuto`, `setTheme()`, `toggleTheme()`

Todos los bloques y secciones soportan colores independientes para light y dark (texto, fondos, bordes, botones, menús).

---

## Tipografía responsiva

El sistema de fuentes calcula tamaños fluidos que se adaptan al ancho del viewport:

- **`calcFluidFont`**: fórmula que interpola entre un mínimo y máximo según el ancho del target
- Zoom configurable por breakpoint (mobile, tablet, desktop) en las opciones del site
- Cada bloque puede heredar del site o definir su propio `fontSize` y `lineHeight`
- Headers (H1–H6) con tamaño, fuente, peso y altura de línea configurables globalmente
- Carga dinámica de **Google Fonts** con pesos y variantes italic seleccionables

---

## API REST

Autenticación JWT en todas las rutas (excepto health check y serve de media).

### Auth

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Login (devuelve JWT) |
| `GET` | `/api/me` | Usuario actual |

### Sites

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/sites` | Listar sitios (paginado, filtrable) |
| `POST` | `/api/sites` | Crear sitio con páginas por defecto |
| `GET` | `/api/sites/:id` | Obtener sitio (opciones resueltas al locale) |
| `PUT` | `/api/sites/:id` | Actualizar sitio (merge por locale) |
| `PUT` | `/api/sites/:id/live` | Publicar sitio (regenera páginas renderizadas) |
| `DELETE` | `/api/sites/:id` | Eliminar sitio |
| `POST` | `/api/sites/:id/locales` | Añadir idioma al sitio |
| `DELETE` | `/api/sites/:id/locales/:code` | Eliminar idioma (cascade) |

### Pages

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/sites/:id/pages` | Listar páginas (paginado, filtrable) |
| `POST` | `/api/sites/:id/pages` | Crear página o post |
| `GET` | `/api/sites/:id/pages/:pageId` | Obtener página (layout resuelto al locale) |
| `PUT` | `/api/sites/:id/pages/:pageId` | Actualizar página (merge por locale) |
| `DELETE` | `/api/sites/:id/pages/:pageId` | Eliminar página |
| `GET` | `/api/sites/:id/routes` | Todas las rutas (para vue-router) |
| `POST` | `/api/sites/:id/sections/next-id` | Siguiente ID de sección |
| `POST` | `/api/sites/:id/blocks/next-id` | Siguiente ID de bloque |

### Media

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/media` | Subir imagen (genera thumbnail WebP 150×150) |
| `GET` | `/api/media` | Listar media (paginado, filtrable) |
| `GET` | `/api/media/:id` | Obtener metadata |
| `DELETE` | `/api/media/:id` | Eliminar (archivo + thumbnail) |
| `GET` | `/media/:name` | Servir archivo (público, sin auth) |

### Paginación

Todos los listados usan **cursor-based pagination** con soporte de filtros:

- `cursor` — ID del último elemento de la página anterior
- `limit` — Elementos por página (máx. 100, opcional = todos)
- `filter[columna]` — Filtros con operadores: `=`, `_neq`, `_like` (ILIKE), `_gt`, `_gte`, `_lt`, `_lte`, `_in`, `_isnull`
- Respuesta: `{ data, next_cursor, total, has_more }`

---

## Motor de renderizado

El backend genera HTML+CSS estático a partir del layout almacenado y lo cachea en la tabla `page_renders`.

**Flujo:**
1. Al publicar un sitio (`PUT /sites/:id/live`), se regeneran todas las páginas
2. El motor recorre secciones y bloques, generando CSS responsivo y HTML semántico
3. Cada tipo de bloque tiene su función de renderizado dedicada (`writeTextBlock`, `writeImageBlock`, `writeButtonBlock`, etc.)
4. El resultado se sirve como HTML estático desde `ServePage` sin pasar por Vue

**Tipos de bloque renderizados:**
- Text → HTML del editor TipTap
- Image → `<img>` responsiva con srcset por breakpoint
- Button → `<a>` estilizado con hover/active/focus
- Icon → SVG embebido
- Space → `<div>` con border-top
- DarkMode → `<button>` con toggle JS inline
- LanguageSwitcher → `<select>` con opciones por locale
- Menu → `<nav><ul>` jerárquico con estados hover/active

**CSS generado:**
- Sistema de grid por breakpoint con media queries
- Variables CSS para colores light/dark
- Fuentes fluidas con clamp()
- Estilos de headers (H1–H6) según configuración del site
- Backgrounds, bordes y espaciados por bloque y sección

---

## Secciones

Las páginas se componen de secciones. Cada sección es un CSS Grid independiente con su propia configuración de columnas, filas, gap, fondo, bordes, padding y margin.

**Site header & footer:** Secciones especiales definidas en `site.options.header` y `site.options.footer`, compartidas entre todas las páginas del sitio.

**Opciones de sección:**
- Ancho máximo y fullWidth
- Ocultar en breakpoints específicos
- Background: color, imagen, gradiente (con soporte light/dark)
- Padding y margin por lado
- Filas dinámicas: crecen automáticamente al insertar bloques y se reducen con `trimRows`

---

## Gestión de rutas

El frontend genera rutas dinámicas en vue-router a partir de los slugs de cada página, organizadas por locale:

```
GET /api/sites/:id/routes → { "es": [{ "path": "/", "page_id": 1 }], "en": [{ "path": "/en", "page_id": 1 }] }
```

Las rutas se cargan al abrir un sitio y se inyectan dinámicamente en el router. Cada página tiene slugs independientes por idioma, permitiendo URLs como `/nosotros` en ES y `/about` en EN.

---

## Stack tecnológico

### Frontend (`vuebo/`)

| Tecnología | Uso |
|------------|-----|
| Vue 3 | Framework UI con `<script setup>` |
| TypeScript | Tipado estático |
| Vite Plus | Build tool y dev server |
| Pinia | Estado global (10 stores) |
| Vue Router 5 | Rutas dinámicas |
| vue-i18n | Internacionalización de la UI |
| CoreUI 5 | Framework CSS + componentes |
| TipTap | Editor de texto enriquecido |
| interact.js | Drag & drop, resize |
| VeeValidate | Validación de formularios |
| Dexie | IndexedDB (fuentes offline) |
| ofetch | Cliente HTTP |
| Tabler Icons | Iconos SVG |
| Sass | Preprocesador CSS |
| unplugin-auto-import | Auto-import de composables, stores y tipos |
| unplugin-vue-components | Auto-import de componentes |

**Stores:**
- `authStore` — Autenticación JWT
- `siteStore` — Sitio actual
- `pageStore` — Página actual, locale, layout
- `editorStore` — Modo del editor (draw/edit)
- `viewportStore` — Viewport activo (mobile/tablet/desktop)
- `drawingStore` — Estado del dibujo/move/resize
- `historyStore` — Undo/redo de cambios
- `errorsStore` — Notificaciones de error
- `appNavigationStore` — Navegación de la app
- `settingsNavigationStore` — Navegación del panel de settings

**Composables:**
- `useNewBlock` — Handler de drag para dibujar bloques
- `useMoveBlock` — Handler de drag para mover bloques
- `useResizeBlock` — Handler de resize con live grid snapping
- `useBlockGrid` — Estilo inline del grid para un bloque
- `useBlockBase` — Estilos base compartidos (fondo, texto, grid)
- `useGridConversion` — Conversión píxel → grid, colisiones, push-down, trim
- `useSectionGrid` — Configuración del grid de una sección
- `useBackgroundStyles` — Estilos de fondo (color, imagen, gradiente)
- `useBlockLink` — Capa de enlace sobre bloques
- `useFontSize` — Tipografía responsiva con `calcFluidFont`
- `useGoogleFonts` — Carga dinámica de Google Fonts
- `useTipTap` — Instancia del editor TipTap
- `useTheme` — Sistema de temas dark/light
- `useApi` — Cliente HTTP con auth
- `usePagesApi` — Operaciones CRUD de páginas
- `useValidation` — Validaciones de formularios
- `useReferenceData` — Nombres de idiomas y países traducidos

### Backend (`echo/`)

| Tecnología | Uso |
|------------|-----|
| Go 1.26 | Lenguaje principal |
| Echo v5 | Framework HTTP |
| PostgreSQL | Base de datos |
| pgx/v5 | Driver PostgreSQL |
| sqlc | Generación de código SQL type-safe |
| golang-migrate | Migraciones de base de datos |
| golang-jwt | Autenticación JWT |
| godotenv | Variables de entorno desde `.env` |
| webp | Generación de thumbnails WebP |

---

## Puesta en marcha

### Requisitos

- Node.js + pnpm
- Go 1.26+
- PostgreSQL
- sqlc (para generar código de queries)

### Backend

El backend se compone de dos servicios independientes que comparten la misma base de datos y directorio de medios:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Admin** | `SERVER_PORT` (`:8080`) | API REST con JWT, CRUD completo, upload de media |
| **Render** | `RENDER_PORT` (`:3000`) | Sirve páginas HTML renderizadas y archivos de media |

```bash
cd echo
cp .env.example .env          # Configurar DATABASE_URL, JWT_SECRET, SERVER_PORT, RENDER_PORT, MEDIA_DIR
make migrate-up               # Ejecutar migraciones
make sqlc                     # Generar código sqlc (si se modificaron queries)

# Ejecutar ambos servicios
make run-admin                # Backoffice API (terminal 1)
make run-render               # Servidor público (terminal 2)

# O ambos a la vez
make run
```

**Variables de entorno:**

| Variable | Servicio | Descripción | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Ambos | URL de conexión PostgreSQL | — (requerido) |
| `JWT_SECRET` | Admin | Secreto para tokens JWT | — (requerido) |
| `SERVER_PORT` | Admin | Puerto del servidor admin | `:8080` |
| `RENDER_PORT` | Render | Puerto del servidor render | `:3000` |
| `MEDIA_DIR` | Ambos | Directorio de archivos subidos | `./uploads` |
| `ENV` | Ambos | Entorno (`development`/`production`) | `development` |

### Frontend

```bash
cd vuebo
pnpm install
pnpm dev                      # Dev server
pnpm build                    # Build de producción
pnpm preview                  # Preview del build
```

---

## Flujo de trabajo

1. **Registrar/login** → JWT token
2. **Crear sitio** → Se generan header, footer y página home por defecto
3. **Abrir editor** → Se carga el layout con secciones y bloques
4. **Dibujar bloques** → Seleccionar tipo, arrastrar sobre el grid
5. **Editar contenido** → Texto con TipTap, imágenes, colores, fuentes
6. **Configurar secciones** → Fondos, espaciado, ocultar por breakpoint
7. **Publicar** → `PUT /sites/:id/live` renderiza todas las páginas a HTML estático
8. **Servir** → El endpoint público sirve las páginas renderizadas

---

## Licencia

MIT. Proyecto demo Guillermo Valentín.
