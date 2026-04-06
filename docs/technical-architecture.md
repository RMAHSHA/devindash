# Devin Task Dashboard — Technical Architecture

## Table of Contents

- [1. Overview](#1-overview)
- [2. System Architecture](#2-system-architecture)
- [3. Backend Architecture](#3-backend-architecture)
  - [3.1 Technology Stack](#31-technology-stack)
  - [3.2 Project Structure](#32-project-structure)
  - [3.3 API Endpoints](#33-api-endpoints)
  - [3.4 External API Integration](#34-external-api-integration)
  - [3.5 Middleware & Security](#35-middleware--security)
  - [3.6 Error Handling](#36-error-handling)
- [4. Frontend Architecture](#4-frontend-architecture)
  - [4.1 Technology Stack](#41-technology-stack)
  - [4.2 Project Structure](#42-project-structure)
  - [4.3 Component Hierarchy](#43-component-hierarchy)
  - [4.4 State Management](#44-state-management)
  - [4.5 UI Component Library](#45-ui-component-library)
  - [4.6 Styling Architecture](#46-styling-architecture)
- [5. Data Flow](#5-data-flow)
- [6. Configuration & Environment](#6-configuration--environment)
- [7. Build & Tooling](#7-build--tooling)
- [8. Deployment Considerations](#8-deployment-considerations)
- [9. Security Considerations](#9-security-considerations)
- [10. Future Architecture Considerations](#10-future-architecture-considerations)

---

## 1. Overview

The Devin Task Dashboard is a full-stack web application that provides a real-time monitoring interface for Devin AI sessions. It acts as a proxy layer between the end user and the [Devin API](https://api.devin.ai/v1), presenting session data in an interactive, filterable dashboard.

**Key capabilities:**

- Real-time session listing with auto-refresh (30-second polling)
- Session filtering by status and user
- Aggregated statistics (total, active, completed, errors, unique users)
- Expandable session detail rows
- Direct links to Devin session URLs

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              React SPA (Vite + TypeScript)                    │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │  │  App    │  │ Session  │  │  Stats     │  │  Filter    │  │  │
│  │  │Component│──│  Table   │  │  Cards     │  │  Controls  │  │  │
│  │  └─────────┘  └──────────┘  └────────────┘  └────────────┘  │  │
│  └──────────────────────┬────────────────────────────────────────┘  │
│                         │ HTTP (fetch)                              │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  CORS Middleware                                              │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  GET /healthz              → Health check                     │  │
│  │  GET /api/sessions         → List sessions (proxy + enrich)   │  │
│  │  GET /api/sessions/{id}    → Get session detail (proxy)       │  │
│  └──────────────────────┬────────────────────────────────────────┘  │
│                         │ httpx (async)                             │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Devin API (api.devin.ai/v1)                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  GET /sessions             → List all sessions                │  │
│  │  GET /sessions/{id}        → Get session details              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Architecture style:** Client-Server with Backend-for-Frontend (BFF) pattern. The FastAPI backend acts as a thin proxy/adapter layer that:

1. Secures the Devin API token (kept server-side only)
2. Enriches responses with derived data (e.g., unique user lists)
3. Provides a simplified API surface for the frontend

---

## 3. Backend Architecture

### 3.1 Technology Stack

| Technology    | Version   | Purpose                              |
|---------------|-----------|--------------------------------------|
| Python        | ^3.12     | Runtime                              |
| FastAPI       | ^0.135.3  | Web framework (with `standard` extras) |
| httpx         | ^0.28.1   | Async HTTP client for Devin API calls |
| python-dotenv | ^1.2.2    | Environment variable loading          |
| psycopg       | ^3.3.3    | PostgreSQL driver (future use)        |
| Poetry        | —         | Dependency management                 |

### 3.2 Project Structure

```
devin-dashboard-backend/
├── app/
│   ├── __init__.py          # Package marker
│   └── main.py              # Application entry point & all route definitions
├── tests/
│   └── __init__.py          # Test package marker
├── pyproject.toml           # Poetry project configuration
└── README.md                # Backend-specific readme
```

The backend follows a single-module architecture. All application logic — including the FastAPI app instance, middleware configuration, helper functions, and route handlers — resides in `app/main.py`.

### 3.3 API Endpoints

#### `GET /healthz`

- **Purpose:** Health check for load balancers and monitoring
- **Response:** `{ "status": "ok" }`
- **Authentication:** None

#### `GET /api/sessions`

- **Purpose:** List Devin sessions with optional filtering
- **Query Parameters:**
  | Parameter    | Type   | Default | Constraints  | Description                     |
  |-------------|--------|---------|-------------|----------------------------------|
  | `limit`     | int    | 100     | 1–100       | Number of sessions to return     |
  | `offset`    | int    | 0       | ≥ 0         | Pagination offset                |
  | `user_email`| string | null    | optional    | Filter by requesting user email  |
- **Response:** Proxied Devin API response enriched with a `users` field containing a sorted, deduplicated list of all requesting user emails from the returned sessions.
- **Authentication:** Server-side via `DEVIN_API_TOKEN`

#### `GET /api/sessions/{session_id}`

- **Purpose:** Retrieve detailed information for a single session
- **Path Parameters:** `session_id` (string)
- **Response:** Raw proxied response from Devin API
- **Authentication:** Server-side via `DEVIN_API_TOKEN`

### 3.4 External API Integration

The backend communicates with the Devin API at `https://api.devin.ai/v1` using the `httpx.AsyncClient`:

- **Authentication:** Bearer token via the `Authorization` header
- **Timeout:** 30 seconds per request
- **Client lifecycle:** A new `AsyncClient` is created per request (no connection pooling)
- **Error propagation:** Non-200 responses from the Devin API are re-raised as `HTTPException` with the upstream status code and error body

### 3.5 Middleware & Security

- **CORS:** Fully permissive configuration (`allow_origins=["*"]`, all methods, all headers, credentials allowed). This is intentional for development but should be restricted in production.

### 3.6 Error Handling

- Missing `DEVIN_API_TOKEN` → HTTP 500 with descriptive message
- Devin API errors → Proxied status code and error text via `HTTPException`
- FastAPI's built-in validation handles malformed query parameters (422 Unprocessable Entity)

---

## 4. Frontend Architecture

### 4.1 Technology Stack

| Technology              | Version   | Purpose                              |
|------------------------|-----------|--------------------------------------|
| React                  | ^18.3.1   | UI library                           |
| TypeScript             | ~5.6.2    | Type-safe JavaScript                 |
| Vite                   | ^6.0.1    | Build tool & dev server              |
| Tailwind CSS           | ^3.4.16   | Utility-first CSS framework          |
| Radix UI               | ^1.2.4    | Accessible primitive components      |
| Lucide React           | ^0.364.0  | Icon library                         |
| Recharts               | ^2.12.4   | Charting library (available)         |
| class-variance-authority| ^0.7.1   | Component variant management         |
| tailwind-merge         | ^3.5.0    | Tailwind class conflict resolution   |
| tailwindcss-animate    | ^1.0.7    | Animation utilities                  |

### 4.2 Project Structure

```
devin-dashboard-frontend/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images and media
│   ├── components/
│   │   └── ui/              # Reusable UI primitives (shadcn/ui style)
│   │       ├── badge.tsx    # Status badge component
│   │       ├── card.tsx     # Card layout component
│   │       ├── skeleton.tsx # Loading placeholder component
│   │       └── table.tsx    # Table layout components
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn class merger)
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application-specific styles
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles & Tailwind directives
│   └── vite-env.d.ts        # Vite type declarations
├── index.html               # HTML shell
├── vite.config.ts           # Vite configuration with path aliases
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript project references
├── tsconfig.app.json        # App TypeScript config
├── tsconfig.node.json       # Node TypeScript config
├── eslint.config.js         # ESLint flat config
├── components.json          # shadcn/ui component config
└── package.json             # Dependencies & scripts
```

### 4.3 Component Hierarchy

```
<StrictMode>
  └── <App>                           # Root component — state, data fetching, layout
      ├── <header>                    # Sticky top bar with title, user filter, refresh
      └── <main>
          ├── <Card> × 5             # Statistics cards (Total, Active, Completed, Errors, Users)
          ├── Filter indicator        # Shows active filters with clear option
          └── <Card>                  # Sessions table container
              └── <Table>
                  ├── <TableHeader>   # Column headers
                  └── <TableBody>
                      └── <SessionRow> × N   # One per session
                          ├── <TableRow>      # Summary row (clickable)
                          └── <TableRow>      # Detail row (expandable)
```

### 4.4 State Management

The application uses React's built-in `useState` and `useEffect` hooks — no external state management library.

| State Variable    | Type       | Purpose                                    |
|-------------------|------------|--------------------------------------------|
| `sessions`        | `Session[]`| Fetched session data                       |
| `loading`         | `boolean`  | Initial load state                         |
| `error`           | `string`   | Error message from API failures            |
| `refreshing`      | `boolean`  | Background refresh state                   |
| `statusFilter`    | `string`   | Current status filter (`all`, `active`, `completed`, `error`) |
| `userFilter`      | `string`   | Current user email filter                  |
| `availableUsers`  | `string[]` | Accumulated unique user emails             |

**Data fetching strategy:**

- Initial fetch on component mount
- Auto-refresh every 30 seconds via `setInterval`
- Manual refresh via the Refresh button
- User filter changes trigger a re-fetch (via `useCallback` dependency)
- Status filtering is performed client-side on the already-fetched data

### 4.5 UI Component Library

The frontend uses **shadcn/ui-style** components — not installed as a package dependency, but generated as local source files in `src/components/ui/`. Each component:

- Is built on top of Radix UI primitives for accessibility
- Uses `class-variance-authority` (CVA) for variant management
- Uses the `cn()` utility for merging Tailwind classes
- Follows the `forwardRef` pattern for ref forwarding

**Components:**

| Component   | Source          | Purpose                         |
|-------------|-----------------|----------------------------------|
| `Badge`     | `badge.tsx`     | Status labels with color variants |
| `Card`      | `card.tsx`      | Content container with header    |
| `Skeleton`  | `skeleton.tsx`  | Loading placeholder animation    |
| `Table`     | `table.tsx`     | Data table with header/body/rows |

### 4.6 Styling Architecture

- **Framework:** Tailwind CSS v3 with utility-first approach
- **Dark mode:** Class-based (configured but not actively used)
- **Animations:** `tailwindcss-animate` plugin for transitions
- **Custom properties:** CSS variables for border radius (`--radius`)
- **Class merging:** `tailwind-merge` resolves conflicting Tailwind classes at runtime
- **Color system:** Uses Tailwind's built-in color palette (slate, blue, green, red, amber, yellow, purple)

---

## 5. Data Flow

```
1. User opens dashboard
   │
2. App component mounts
   │
3. fetchSessions() called
   │
   ├── Constructs query params (limit, user_email)
   │
   ├── fetch(`${API_BASE}/api/sessions?${params}`)
   │      │
   │      ▼
   │   FastAPI receives request
   │      │
   │      ├── Validates query params (FastAPI/Pydantic)
   │      ├── Reads DEVIN_API_TOKEN from environment
   │      ├── Builds Authorization header
   │      ├── Forwards request to Devin API via httpx
   │      ├── Extracts unique user emails from response
   │      └── Returns enriched response
   │      │
   │      ▼
   │   Frontend receives JSON
   │
4. setSessions(data.sessions)
   │
5. setAvailableUsers(merged unique emails)
   │
6. Compute derived state:
   │   ├── filteredSessions (client-side status filter)
   │   └── stats (total, active, completed, errors, uniqueUsers)
   │
7. Render dashboard
   │
8. setInterval → repeat from step 3 every 30s
```

### Session Data Model

```typescript
interface Session {
  session_id: string          // Unique identifier
  title?: string              // User-provided session title
  status: string              // Primary status: 'running' | 'exit' | 'error' | 'suspended'
  status_detail?: string      // Sub-status: 'finished' | 'waiting_for_user' | 'waiting_for_approval'
  created_at: string          // ISO 8601 timestamp
  updated_at?: string         // ISO 8601 timestamp
  url?: string                // Link to the Devin session
  requesting_user_email?: string  // Email of the user who created the session
  status_enum?: string        // Machine-readable status code
}
```

### Status Mapping Logic

The dashboard maps API statuses to user-friendly labels and visual indicators:

| API Status | Detail              | Display Label       | Color    | Icon            |
|-----------|---------------------|---------------------|----------|-----------------|
| running   | finished            | Completed           | Green    | CheckCircle2    |
| running   | waiting_for_user    | Waiting for user    | Amber    | Pause           |
| running   | waiting_for_approval| Needs approval      | Blue     | Loader2 (spin)  |
| running   | (other)             | Running             | Blue     | Loader2 (spin)  |
| exit      | —                   | Finished            | Gray     | CheckCircle2    |
| error     | —                   | Error               | Red      | XCircle         |
| suspended | —                   | Suspended           | Yellow   | Pause           |

---

## 6. Configuration & Environment

### Backend Environment Variables

| Variable          | Required | Description                           |
|-------------------|----------|---------------------------------------|
| `DEVIN_API_TOKEN` | Yes      | Bearer token for Devin API authentication |

Loaded via `python-dotenv` from a `.env` file in the backend directory.

### Frontend Environment Variables

| Variable        | Required | Default                | Description                  |
|-----------------|----------|------------------------|------------------------------|
| `VITE_API_URL`  | No       | `http://localhost:8000` | Backend API base URL         |

Set at build time via Vite's `import.meta.env` mechanism.

---

## 7. Build & Tooling

### Backend

```bash
# Install dependencies
cd devin-dashboard-backend
poetry install

# Run development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Install dependencies
cd devin-dashboard-frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build       # Runs: tsc -b && vite build

# Lint
npm run lint        # Runs: eslint .

# Preview production build
npm run preview     # Runs: vite preview
```

### Path Aliases

The frontend uses `@/` as a path alias for `./src/`, configured in both:

- `vite.config.ts` (for Vite's module resolution)
- `tsconfig.json` (for TypeScript's type resolution)

---

## 8. Deployment Considerations

### Production Checklist

1. **CORS:** Restrict `allow_origins` to the actual frontend domain(s)
2. **API Token:** Use a secrets manager or secure environment variable injection — never commit `.env` files
3. **HTTPS:** Both frontend and backend should be served over TLS
4. **Connection Pooling:** Consider using a shared `httpx.AsyncClient` with connection pooling for better performance under load
5. **Rate Limiting:** Add rate limiting to the backend to prevent abuse
6. **Frontend Build:** Deploy the Vite production build (`dist/`) behind a CDN or static file server
7. **Backend Process Manager:** Run FastAPI with a production ASGI server (e.g., Uvicorn behind Gunicorn or using multiple workers)
8. **Health Checks:** The `/healthz` endpoint is ready for use with load balancers and container orchestrators

### Recommended Architecture for Production

```
                    CDN / Static Host
                         │
              ┌──────────┴──────────┐
              │   Frontend (dist/)  │
              └──────────┬──────────┘
                         │
                    API Gateway / LB
                         │
              ┌──────────┴──────────┐
              │  FastAPI (Uvicorn)  │
              │  (multiple workers) │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │    Devin API        │
              └─────────────────────┘
```

---

## 9. Security Considerations

| Area                | Current State                        | Recommendation                          |
|---------------------|--------------------------------------|-----------------------------------------|
| API Token Storage   | `.env` file (server-side only)       | Use a secrets manager in production      |
| CORS Policy         | Fully open (`*`)                     | Restrict to frontend origin              |
| Token Exposure      | Token never sent to the client       | Correct — maintain this pattern          |
| Input Validation    | FastAPI query param validation       | Add request body validation if needed    |
| Rate Limiting       | None                                 | Add middleware or API gateway rate limits |
| HTTPS               | Not enforced                         | Enforce in production                    |
| Dependency Scanning | None                                 | Add `safety` or `pip-audit` to CI        |

---

## 10. Future Architecture Considerations

- **Database Integration:** `psycopg` is already a dependency, suggesting planned PostgreSQL integration for caching session data, storing user preferences, or audit logging
- **WebSocket Support:** Replace polling with WebSocket or Server-Sent Events for real-time updates
- **Authentication:** Add user authentication (e.g., OAuth2) so each user sees only their own sessions
- **Charting:** `recharts` is already installed — could be used for session trend visualization, success/failure rates over time
- **Routing:** Add `react-router` for multi-page navigation (e.g., dedicated session detail pages)
- **State Management:** Consider `@tanstack/react-query` for server state caching and automatic refetching
- **Testing:** Expand test infrastructure with `pytest` (backend) and `vitest`/`@testing-library/react` (frontend)
- **CI/CD:** Add GitHub Actions for linting, testing, building, and deploying
