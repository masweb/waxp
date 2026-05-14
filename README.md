# WAXP

Visual CMS with drag & drop page builder. Build complete websites by drawing blocks on a CSS Grid, with multi-language support, full responsive support, dark/light themes, responsive typography, and static rendering.

## Architecture

| Layer | Stack | Directory |
|-------|-------|-----------|
| Frontend | Vue 3 + TypeScript + Vite Plus | `vuebo/` |
| Backend Admin | Go + Echo v5 + PostgreSQL | `echo/` (cmd/admin) |
| Backend Render | Go + Echo v5 + PostgreSQL | `echo/` (cmd/render) |
| AI Agent | LangChain + LangGraph + DeepSeek | `langchain/` |

```
waxp/
├── vuebo/                  # Frontend — Vue 3 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/     # Page builder (blocks, sections, overlay, settings)
│   │   │   └── manager/    # Site management
│   │   ├── composables/    # Reusable logic (drag, grid, blocks, theme...)
│   │   ├── stores/         # Global state with Pinia
│   │   ├── types/          # TypeScript types
│   │   ├── views/          # App views
│   │   ├── router/         # Vue Router with dynamic routes
│   │   ├── i18n/           # Internationalization + reference data
│   │   ├── db/             # IndexedDB (Dexie)
│   │   ├── css/            # Global styles
│   │   └── assets/         # Static assets
│   └── docs/               # Frontend documentation
├── echo/                   # Backend
│   ├── cmd/
│   │   ├── admin/          # Entry point — REST API backoffice
│   │   └── render/         # Entry point — Public page server
│   ├── internal/
│   │   ├── admin/          # Admin server setup (JWT-protected routes)
│   │   ├── renderer/       # Render server setup (read-only, no auth)
│   │   ├── handler/        # HTTP handlers (auth, sites, pages, media, blocks...)
│   │   ├── render/         # Static HTML/CSS rendering engine
│   │   ├── db/             # sqlc generated code
│   │   ├── filter/         # Generic filter system for queries
│   │   ├── middleware/      # JWT auth, CORS
│   │   └── config/         # Config from env (AdminConfig / RenderConfig)
│   ├── db/
│   │   ├── migrations/     # SQL migrations
│   │   └── queries/        # sqlc queries
│   └── project/            # Backend documentation
├── langchain/              # AI Agent — LangChain + LangGraph
│   └── src/
│       ├── server.ts       # Express server + SSE streaming
│       ├── graph.ts        # LangGraph StateGraph (ReAct agent)
│       ├── tools.ts        # LangChain tools (site CRUD)
│       └── api.ts          # Authenticated API client for CMS backend
└── README.md
```

---

## AI Agent (LangChain)

A conversational agent built with **LangChain + LangGraph + DeepSeek** that manages CMS sites via natural language. Runs as a standalone Express server with SSE streaming.

### Architecture

- **LLM**: `ChatDeepSeek` (`deepseek-chat`) bound with LangChain tools
- **Agent pattern**: LangGraph `StateGraph` with ReAct loop — `llmCall` → conditional → `toolNode` → `llmCall` → … → `END`
- **Streaming**: Server-Sent Events (SSE) with token-level streaming, tool call events, and tool results
- **Auth**: Dedicated agent account with JWT auto-renewal (1-hour cache)

### Available tools

| Tool | Description |
|------|-------------|
| `search_sites` | Search sites by name or domain (internal use — resolves names to IDs) |
| `create_site` | Create site with name, domain, and locales (ISO 639-1). Generates header, footer, and default pages |
| `update_site` | Update site name, domain, or options by ID |
| `delete_site` | Delete site by ID (cascade: locales, pages, blocks) |

### System behavior

- Asks for all required fields before creating a site (name, domain, locales)
- Automatically resolves names/domains to IDs via `search_sites` — never asks the user for an ID
- Responds in natural language, never exposes raw JSON or technical details

### Running

```bash
cd langchain
cp .env.example .env          # Configure DEEPSEEK_API_KEY, API_BASE_URL, API_AUTH_EMAIL, API_AUTH_PASSWORD
pnpm install
pnpm dev                      # Agent server on http://localhost:3001
```

**Environment variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | — (required) |
| `API_BASE_URL` | CMS backend URL | `http://localhost:8080` |
| `API_AUTH_EMAIL` | Agent auth email | — (required) |
| `API_AUTH_PASSWORD` | Agent auth password | — (required) |
| `PORT` | Agent server port | `3001` |

---

## Page Builder

The visual editor lets you build pages by dragging blocks onto a responsive grid with 3 independent breakpoints.

### Responsive Grid

| Viewport | Columns | Default Rows | Gap |
|----------|---------|--------------|-----|
| Desktop  | 24      | 12           | 12px|
| Tablet   | 20      | 12           | 8px |
| Mobile   | 8       | 12           | 8px |

Each block stores independent coordinates for the 3 breakpoints (`d`, `m`, `t`), allowing completely different layouts per device. The viewport can be switched in real time from the editor toolbar.

### Block System

Blocks are content units positioned as direct children of the CSS Grid via `grid-column` and `grid-row` with span. They use `contain: size` + `overflow: visible` + `min-width/height: 0` so the grid controls sizing independently of content.

**Available block types:**

| Type | Description |
|------|-------------|
| `Text` | Multilingual content with TipTap editor (bold, italic, headings, lists, tables, code, links...) |
| `Image` | Responsive image with per-device URLs, focal point, zoom, and fit modes |
| `Button` | Button with full styling: light/dark colors for bg, text, borders, hover, active, focus |
| `Icon` | Vector icon (Tabler Icons) with link, color, and configurable size |
| `Menu` | Hierarchical navigation menu with recursive items, per-level fonts, and state colors |
| `Space` | Spacer with configurable divider (color, thickness, line style) |
| `DarkMode` | Dark/light theme toggle with system preference detection |
| `LanguageSwitcher` | Language selector that changes the active locale |

### Draw (drawing blocks)

Draw new blocks directly on the grid by dragging the cursor:

- **interact.js** captures the drag over the section
- Pixel → grid coordinate conversion in real time
- **Visual overlay** (`DrawingOverlay.vue`) shows the semi-transparent selection
- Collision detection: prevents drawing over existing blocks
- **Auto push-down**: if the new block overlaps another, it pushes the existing one down
- **Row expansion**: the grid grows automatically if the drawing exceeds current rows
- Throttled with `requestAnimationFrame` (max 1 update per frame, 60fps)

### Move (moving blocks)

Move blocks by dragging from the `.blockui.move` handle:

- `transform: translate3d()` for visual feedback (GPU-accelerated)
- **cellHalf**: symmetric snapping by offsetting the detection point to the center of the first cell
- Shadow overlay shows the target position while the block moves
- Collision resolution and auto-positioning on other breakpoints
- `trimRows` removes empty rows after moving

### Resize (resizing blocks)

Resize by dragging the right and bottom edges via `.blockui.resize`:

- **Live grid snapping**: updates reactive coordinates live — the block repositions on the real grid each frame, without using `transform: scale()`
- Uses interact.js `event.rect` (not `getBoundingClientRect()`) for accurate dimensions
- cellHalf for symmetric size snapping
- Minimum constraint of 1×1 cell

### Block Data Structure

```typescript
interface Block {
  id: number
  type: string
  locales?: Record<string, string>      // Translatable content per locale
  d: BlockCoords                        // Desktop
  m: BlockCoords                        // Mobile
  t: BlockCoords                        // Tablet
  style: BlockStyle                     // Background, borders, padding, margin
  color?: null | string                 // Text color (light)
  darkColor?: null | string             // Text color (dark)
  fontSize?: null | number              // Font size
  lineHeight?: null | number            // Line height
  divider?: SideBorder                  // Divider line (Space)
  image?: BlockImage                    // Image URLs per breakpoint
  link?: BlockLink                      // Link layer (internal/external/anchor)
  button?: BlockButton                  // Full button styles
  icon?: BlockIcon                      // Icon name and strokeWidth
  menu?: MenuItem[]                     // Menu items (resolved by locale)
  menuColors?: MenuColors               // Normal/hover/active colors × light/dark
  menuFont?: Font                       // Menu level 1 font
  menuSubFont?: Font                    // Menu sub-level font
  isMobileMenu?: boolean                // Marked as mobile menu
}

interface BlockCoords {
  x: number    // Start column (1-indexed)
  y: number    // Start row (1-indexed)
  w: number    // Column span
  h: number    // Row span
}
```

### Options Panel

Each block type has its own settings panel (`ButtonSettings`, `TextSettings`, `ImageSettings`, etc.) loaded dynamically based on the selected block. Includes:

- **Background**: color, image, gradient with light/dark support, focal point, zoom
- **Borders**: per-corner radius, per-side borders (color, thickness, style)
- **Padding / Margin**: per side
- **Font**: Google Fonts selector with weights and italic
- **Colors**: independent pickers for light and dark
- **Link**: internal, external, or anchor
- **Hide on**: hide the block on specific breakpoints
- **Reusable fields**: `ColorPicker`, `NumberRange`, `SectionRange`, `MediaPicker`, `FocalPointPicker`, `FontFamilyField`, `SidesField`, `TextField`

---

## Internationalization (i18n)

### Site Locales System

Each site can have multiple languages (locales). Content is stored as a nested map per locale in the database and resolved to the requested locale in the API response.

**Database storage:**
```json
{ "locales": { "text": { "es": "<p>Hola</p>", "en": "<p>Hello</p>" } } }
```

**API response (`?locale=es`):**
```json
{ "locales": { "text": "<p>Hola</p>" } }
```

Shared fields (styles, colors, coordinates) are not localized — they are the same across all languages.

### Editor UI

The frontend uses **vue-i18n** with messages in `es` and `en` for the editor interface. Auto-imported from `src/i18n/locales/`.

### Reference Data

Independent module in `src/i18n/reference/` with language names (ISO 639-1, 184 entries) and country names (ISO 3166, ~249 entries) translated to `es` and `en`. The `useReferenceData()` composable reacts to the current app locale.

---

## Dark/Light Theme System

- 3 modes: `light`, `dark`, `auto` (follows system preference)
- Persisted in `localStorage`
- Applied via `data-coreui-theme` on `<html>`
- System detection with `matchMedia('(prefers-color-scheme: dark)')`
- Custom event `coreui-theme-change` to react to changes
- `useTheme()` composable with `isDark`, `isLight`, `isAuto`, `setTheme()`, `toggleTheme()`

All blocks and sections support independent colors for light and dark (text, backgrounds, borders, buttons, menus).

---

## Responsive Typography

The font system calculates fluid sizes that adapt to the viewport width:

- **`calcFluidFont`**: formula that interpolates between a minimum and maximum based on the target width
- Configurable zoom per breakpoint (mobile, tablet, desktop) in site options
- Each block can inherit from the site or define its own `fontSize` and `lineHeight`
- Headers (H1–H6) with globally configurable size, font, weight, and line height
- Dynamic loading of **Google Fonts** with selectable weights and italic variants

---

## REST API

JWT authentication on all routes (except health check and media serving).

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `GET` | `/api/me` | Current user |

### Sites

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sites` | List sites (paginated, filterable) |
| `POST` | `/api/sites` | Create site with default pages |
| `GET` | `/api/sites/:id` | Get site (options resolved to locale) |
| `PUT` | `/api/sites/:id` | Update site (merge by locale) |
| `PUT` | `/api/sites/:id/live` | Publish site (regenerates rendered pages) |
| `DELETE` | `/api/sites/:id` | Delete site |
| `POST` | `/api/sites/:id/locales` | Add language to site |
| `DELETE` | `/api/sites/:id/locales/:code` | Remove language (cascade) |

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sites/:id/pages` | List pages (paginated, filterable) |
| `POST` | `/api/sites/:id/pages` | Create page or post |
| `GET` | `/api/sites/:id/pages/:pageId` | Get page (layout resolved to locale) |
| `PUT` | `/api/sites/:id/pages/:pageId` | Update page (merge by locale) |
| `DELETE` | `/api/sites/:id/pages/:pageId` | Delete page |
| `GET` | `/api/sites/:id/routes` | All routes (for vue-router) |
| `POST` | `/api/sites/:id/sections/next-id` | Next section ID |
| `POST` | `/api/sites/:id/blocks/next-id` | Next block ID |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/media` | Upload image (generates 150×150 WebP thumbnail) |
| `GET` | `/api/media` | List media (paginated, filterable) |
| `GET` | `/api/media/:id` | Get metadata |
| `DELETE` | `/api/media/:id` | Delete (file + thumbnail) |
| `GET` | `/media/:name` | Serve file (public, no auth) |

### Pagination

All list endpoints use **cursor-based pagination** with filter support:

- `cursor` — ID of the last item from the previous page
- `limit` — Items per page (max 100, optional = all)
- `filter[column]` — Filters with operators: `=`, `_neq`, `_like` (ILIKE), `_gt`, `_gte`, `_lt`, `_lte`, `_in`, `_isnull`
- Response: `{ data, next_cursor, total, has_more }`

---

## Rendering Engine

The backend generates static HTML+CSS from the stored layout and caches it in the `page_renders` table.

**Flow:**
1. When publishing a site (`PUT /sites/:id/live`), all pages are regenerated
2. The engine iterates over sections and blocks, generating responsive CSS and semantic HTML
3. Each block type has its own dedicated render function (`writeTextBlock`, `writeImageBlock`, `writeButtonBlock`, etc.)
4. The result is served as static HTML from `ServePage` without going through Vue

**Rendered block types:**
- Text → TipTap editor HTML
- Image → responsive `<img>` with srcset per breakpoint
- Button → styled `<a>` with hover/active/focus
- Icon → embedded SVG
- Space → `<div>` with border-top
- DarkMode → `<button>` with inline JS toggle
- LanguageSwitcher → `<select>` with per-locale options
- Menu → hierarchical `<nav><ul>` with hover/active states

**Generated CSS:**
- Grid system per breakpoint with media queries
- CSS variables for light/dark colors
- Fluid fonts with clamp()
- Header styles (H1–H6) per site configuration
- Backgrounds, borders, and spacing per block and section

---

## Sections

Pages are composed of sections. Each section is an independent CSS Grid with its own column, row, gap, background, border, padding, and margin configuration.

**Site header & footer:** Special sections defined in `site.options.header` and `site.options.footer`, shared across all pages in the site.

**Section options:**
- Maximum width and fullWidth
- Hide on specific breakpoints
- Background: color, image, gradient (with light/dark support)
- Padding and margin per side
- Dynamic rows: grow automatically when inserting blocks and shrink with `trimRows`

---

## Route Management

The frontend generates dynamic routes in vue-router from each page's slugs, organized by locale:

```
GET /api/sites/:id/routes → { "es": [{ "path": "/", "page_id": 1 }], "en": [{ "path": "/en", "page_id": 1 }] }
```

Routes are loaded when opening a site and injected dynamically into the router. Each page has independent slugs per language, allowing URLs like `/nosotros` in ES and `/about` in EN.

---

## Technology Stack

### Frontend (`vuebo/`) — [Repository](https://github.com/masweb/waxp-vuebo)

| Technology | Usage |
|------------|-------|
| Vue 3 | UI framework with `<script setup>` |
| TypeScript | Static typing |
| Vite Plus | Build tool and dev server |
| Pinia | Global state (10 stores) |
| Vue Router 5 | Dynamic routes |
| vue-i18n | UI internationalization |
| CoreUI 5 | CSS framework + components |
| TipTap | Rich text editor |
| interact.js | Drag & drop, resize |
| VeeValidate | Form validation |
| Dexie | IndexedDB (offline fonts) |
| ofetch | HTTP client |
| Tabler Icons | SVG icons |
| Sass | CSS preprocessor |
| unplugin-auto-import | Auto-import composables, stores, and types |
| unplugin-vue-components | Auto-import components |

**Stores:**
- `authStore` — JWT authentication
- `siteStore` — Current site
- `pageStore` — Current page, locale, layout
- `editorStore` — Editor mode (draw/edit)
- `viewportStore` — Active viewport (mobile/tablet/desktop)
- `drawingStore` — Drawing/move/resize state
- `historyStore` — Undo/redo changes
- `errorsStore` — Error notifications
- `appNavigationStore` — App navigation
- `settingsNavigationStore` — Settings panel navigation

**Composables:**
- `useNewBlock` — Drag handler for drawing blocks
- `useMoveBlock` — Drag handler for moving blocks
- `useResizeBlock` — Resize handler with live grid snapping
- `useBlockGrid` — Inline grid style for a block
- `useBlockBase` — Shared base styles (background, text, grid)
- `useGridConversion` — Pixel → grid conversion, collisions, push-down, trim
- `useSectionGrid` — Section grid configuration
- `useBackgroundStyles` — Background styles (color, image, gradient)
- `useBlockLink` — Link layer over blocks
- `useFontSize` — Responsive typography with `calcFluidFont`
- `useGoogleFonts` — Dynamic Google Fonts loading
- `useTipTap` — TipTap editor instance
- `useTheme` — Dark/light theme system
- `useApi` — HTTP client with auth
- `usePagesApi` — Page CRUD operations
- `useValidation` — Form validations
- `useReferenceData` — Translated language and country names

### Backend (`echo/`) — [Repository](https://github.com/masweb/waxp-echo)

| Technology | Usage |
|------------|-------|
| Go 1.26 | Main language |
| Echo v5 | HTTP framework |
| PostgreSQL | Database |
| pgx/v5 | PostgreSQL driver |
| sqlc | Type-safe SQL code generation |
| golang-migrate | Database migrations |
| golang-jwt | JWT authentication |
| godotenv | Environment variables from `.env` |
| webp | WebP thumbnail generation |

### AI Agent (`langchain/`)

| Technology | Usage |
|------------|-------|
| LangChain | Tool definitions and LLM abstraction |
| LangGraph | StateGraph agent with ReAct loop |
| DeepSeek | LLM provider (`deepseek-chat`) |
| Express 5 | SSE streaming server |
| Zod | Tool schema validation |

---

## Getting Started

### Requirements

- Node.js + pnpm
- Go 1.26+
- PostgreSQL
- sqlc (for generating query code)
- DeepSeek API key (for AI agent)

### Backend

The backend consists of two independent services that share the same database and media directory:

| Service | Port | Description |
|---------|------|-------------|
| **Admin** | `SERVER_PORT` (`:8080`) | REST API with JWT, full CRUD, media upload |
| **Render** | `RENDER_PORT` (`:3000`) | Serves rendered HTML pages and media files |
| **AI Agent** | `:3001` | LangChain agent for site CRUD via natural language |

```bash
cd echo
cp .env.example .env          # Configure DATABASE_URL, JWT_SECRET, SERVER_PORT, RENDER_PORT, MEDIA_DIR
make migrate-up               # Run migrations
make sqlc                     # Generate sqlc code (if queries were modified)

# Run both services
make run-admin                # Backoffice API (terminal 1)
make run-render               # Public server (terminal 2)

# Or both at once
make run
```

**Environment variables:**

| Variable | Service | Description | Default |
|----------|---------|-------------|---------|
| `DATABASE_URL` | Both | PostgreSQL connection URL | — (required) |
| `JWT_SECRET` | Admin | Secret for JWT tokens | — (required) |
| `SERVER_PORT` | Admin | Admin server port | `:8080` |
| `RENDER_PORT` | Render | Render server port | `:3000` |
| `MEDIA_DIR` | Both | Uploaded files directory | `./uploads` |
| `ENV` | Both | Environment (`development`/`production`) | `development` |

### Frontend

```bash
cd vuebo
pnpm install
pnpm dev                      # Dev server
pnpm build                    # Production build
pnpm preview                  # Build preview
```

### AI Agent

```bash
cd langchain
cp .env.example .env          # Configure DEEPSEEK_API_KEY, API_BASE_URL, API_AUTH_EMAIL, API_AUTH_PASSWORD
pnpm install
pnpm dev                      # Agent server on http://localhost:3001
```

---

## Workflow

1. **Register/login** → JWT token
2. **Create site** → Header, footer, and home page are generated by default
3. **Open editor** → Layout loads with sections and blocks
4. **Draw blocks** → Select type, drag on the grid
5. **Edit content** → Text with TipTap, images, colors, fonts
6. **Configure sections** → Backgrounds, spacing, hide per breakpoint
7. **Publish** → `PUT /sites/:id/live` renders all pages to static HTML
8. **Serve** → The public endpoint serves the rendered pages

---

## License

MIT. Demo project by Guillermo Valentín.
