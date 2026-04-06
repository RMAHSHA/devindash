# Devin Task Dashboard — User Manual

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Prerequisites](#2-prerequisites)
- [3. Installation & Setup](#3-installation--setup)
  - [3.1 Clone the Repository](#31-clone-the-repository)
  - [3.2 Backend Setup](#32-backend-setup)
  - [3.3 Frontend Setup](#33-frontend-setup)
- [4. Starting the Application](#4-starting-the-application)
  - [4.1 Start the Backend](#41-start-the-backend)
  - [4.2 Start the Frontend](#42-start-the-frontend)
  - [4.3 Access the Dashboard](#43-access-the-dashboard)
- [5. Using the Dashboard](#5-using-the-dashboard)
  - [5.1 Dashboard Overview](#51-dashboard-overview)
  - [5.2 Statistics Cards](#52-statistics-cards)
  - [5.3 Sessions Table](#53-sessions-table)
  - [5.4 Session Details](#54-session-details)
  - [5.5 Filtering Sessions](#55-filtering-sessions)
  - [5.6 Refreshing Data](#56-refreshing-data)
- [6. Understanding Session Statuses](#6-understanding-session-statuses)
- [7. Configuration](#7-configuration)
  - [7.1 Backend Configuration](#71-backend-configuration)
  - [7.2 Frontend Configuration](#72-frontend-configuration)
- [8. Building for Production](#8-building-for-production)
- [9. Troubleshooting](#9-troubleshooting)
- [10. FAQ](#10-faq)

---

## 1. Introduction

The **Devin Task Dashboard** is a web-based monitoring tool that gives you a real-time overview of your Devin AI sessions. It connects to the Devin API to display all your sessions in a clean, interactive table with filtering, status tracking, and summary statistics.

**What you can do with the dashboard:**

- View all your Devin sessions at a glance
- See how many sessions are active, completed, or have errors
- Filter sessions by status or by user
- Expand any session row to see full details
- Jump directly to a Devin session via its URL
- Monitor session activity with automatic 30-second data refreshes

---

## 2. Prerequisites

Before setting up the dashboard, make sure you have the following installed on your system:

| Requirement | Minimum Version | How to Check           |
|-------------|-----------------|------------------------|
| Python      | 3.12+           | `python --version`     |
| Poetry      | Latest          | `poetry --version`     |
| Node.js     | 18+             | `node --version`       |
| npm         | 9+              | `npm --version`        |
| Git         | Any recent      | `git --version`        |

You will also need a **Devin API Token**. You can generate one at:
👉 [https://app.devin.ai/settings/api-keys](https://app.devin.ai/settings/api-keys)

---

## 3. Installation & Setup

### 3.1 Clone the Repository

```bash
git clone https://github.com/RMAHSHA/devindash.git
cd devindash
```

### 3.2 Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd devin-dashboard-backend
   ```

2. Install Python dependencies using Poetry:

   ```bash
   poetry install
   ```

3. Create an environment file for your API token:

   ```bash
   cp .env.example .env    # If .env.example exists
   # OR create it manually:
   echo "DEVIN_API_TOKEN=your-api-token-here" > .env
   ```

4. Open the `.env` file and replace `your-api-token-here` with your actual Devin API token.

> **Important:** Never commit your `.env` file to version control. It is already listed in `.gitignore`.

### 3.3 Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd devin-dashboard-frontend
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

No additional configuration is needed for local development — the frontend defaults to connecting to the backend at `http://localhost:8000`.

---

## 4. Starting the Application

You need to run both the backend and frontend servers. Open two separate terminal windows or tabs.

### 4.1 Start the Backend

```bash
cd devin-dashboard-backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Verify the backend is running** by opening your browser to:
[http://localhost:8000/healthz](http://localhost:8000/healthz)

You should see: `{"status": "ok"}`

### 4.2 Start the Frontend

In a second terminal:

```bash
cd devin-dashboard-frontend
npm run dev
```

You should see output like:

```
  VITE v6.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://x.x.x.x:5173/
```

### 4.3 Access the Dashboard

Open your browser and navigate to:

👉 **[http://localhost:5173](http://localhost:5173)**

The dashboard will load and begin fetching your Devin sessions.

---

## 5. Using the Dashboard

### 5.1 Dashboard Overview

The dashboard is organized into three main areas:

```
┌──────────────────────────────────────────────────────────┐
│  Header Bar                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Dashboard Title │  │ User Filter  │  │ Refresh Btn  │ │
│  └────────────────┘  └──────────────┘  └──────────────┘ │
├──────────────────────────────────────────────────────────┤
│  Statistics Cards                                        │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌───────┐ ┌──────┐ │
│  │ Total  │ │ Active │ │Completed │ │Errors │ │Users │ │
│  └────────┘ └────────┘ └──────────┘ └───────┘ └──────┘ │
├──────────────────────────────────────────────────────────┤
│  Sessions Table                                          │
│  ┌──────┬───────┬──────┬────────┬─────────┬─────────┐   │
│  │  ID  │ Title │ User │ Status │ Created │ Updated │   │
│  ├──────┼───────┼──────┼────────┼─────────┼─────────┤   │
│  │ ...  │  ...  │ ...  │  ...   │  ...    │  ...    │   │
│  └──────┴───────┴──────┴────────┴─────────┴─────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Statistics Cards

At the top of the dashboard, five summary cards show at-a-glance metrics:

| Card          | Description                                                |
|---------------|------------------------------------------------------------|
| **Total Sessions** | The total number of sessions returned from the API    |
| **Active**    | Sessions currently running (not yet finished)              |
| **Completed** | Sessions that have finished successfully                   |
| **Errors**    | Sessions that ended with an error                          |
| **Users**     | Number of unique users who have created sessions           |

**Clicking a statistics card** filters the sessions table to show only sessions matching that status. For example, clicking "Active" shows only currently running sessions.

### 5.3 Sessions Table

The sessions table displays all your Devin sessions with the following columns:

| Column    | Description                                                  |
|-----------|--------------------------------------------------------------|
| **ID**    | The first 8 characters of the session ID (hover for tooltip) |
| **Title** | The session title, or "Untitled session" if none was set     |
| **User**  | The username portion of the requesting user's email          |
| **Status**| Color-coded status badge with an icon (see [Section 6](#6-understanding-session-statuses)) |
| **Created** | Relative time since the session was created (e.g., "5m ago") |
| **Updated** | Relative time since the last update, or "-" if not updated  |
| **Actions** | External link icon to open the session in Devin, plus expand/collapse arrow |

### 5.4 Session Details

**Click on any row** in the sessions table to expand it and see the full session details:

- **Session ID** — The complete session identifier
- **User** — Full email address of the requesting user
- **Status Detail** — More specific status information (e.g., "finished", "waiting_for_user")
- **Status Enum** — Machine-readable status code
- **Created** — Full date and time of session creation
- **Updated** — Full date and time of the last update
- **URL** — Clickable link to open the session directly in the Devin web app

Click the row again to collapse the detail view.

### 5.5 Filtering Sessions

The dashboard provides two ways to filter sessions:

#### Filter by Status

Click on any of the statistics cards (Total, Active, Completed, Errors) to filter the table. The active filter is displayed below the statistics cards with a label.

| Filter     | Shows                                                         |
|------------|---------------------------------------------------------------|
| All        | All sessions (default)                                        |
| Active     | Sessions that are currently running and not finished           |
| Completed  | Sessions with status "exit" or running with detail "finished" |
| Error      | Sessions that ended with an error                             |

#### Filter by User

Use the **user dropdown** in the header bar to select a specific user. This filters sessions server-side, meaning only that user's sessions are fetched from the API.

The user list is populated automatically from the sessions data as you use the dashboard.

#### Clear Filters

When filters are active, a **"Clear all"** link appears below the statistics cards. Click it to reset all filters and show all sessions.

### 5.6 Refreshing Data

The dashboard keeps your data up to date in two ways:

1. **Automatic refresh:** The dashboard automatically fetches new data every **30 seconds**. You do not need to do anything — the data updates in the background.

2. **Manual refresh:** Click the **Refresh** button in the top-right corner of the header to immediately fetch the latest data. The refresh icon will spin while data is being loaded.

---

## 6. Understanding Session Statuses

Sessions can have the following statuses, each shown with a distinct color and icon:

| Status              | Color  | Icon              | Meaning                                          |
|---------------------|--------|-------------------|--------------------------------------------------|
| **Completed**       | Green  | Check circle      | The session has finished its work successfully    |
| **Running**         | Blue   | Spinning loader   | The session is actively working                   |
| **Waiting for user**| Amber  | Pause             | The session needs your input to continue          |
| **Needs approval**  | Blue   | Spinning loader   | The session needs you to approve an action        |
| **Finished**        | Gray   | Check circle      | The session exited normally                       |
| **Error**           | Red    | X circle          | The session encountered an error                  |
| **Suspended**       | Yellow | Pause             | The session has been paused                       |

**Tip:** If you see sessions in "Waiting for user" status, go to the Devin app (click the external link icon) to provide the needed input.

---

## 7. Configuration

### 7.1 Backend Configuration

The backend is configured through environment variables. Create a `.env` file in the `devin-dashboard-backend/` directory:

```env
# Required: Your Devin API token
DEVIN_API_TOKEN=your-devin-api-token-here
```

| Variable          | Required | Description                                       |
|-------------------|----------|---------------------------------------------------|
| `DEVIN_API_TOKEN` | Yes      | Your Devin API authentication token. Get one at [app.devin.ai/settings/api-keys](https://app.devin.ai/settings/api-keys) |

### 7.2 Frontend Configuration

The frontend can be configured using environment variables prefixed with `VITE_`:

| Variable       | Required | Default                 | Description                         |
|----------------|----------|-------------------------|-------------------------------------|
| `VITE_API_URL` | No       | `http://localhost:8000`  | URL of the backend API server       |

To set it, create a `.env.local` file in the `devin-dashboard-frontend/` directory:

```env
VITE_API_URL=https://your-backend-api.example.com
```

---

## 8. Building for Production

### Build the Frontend

```bash
cd devin-dashboard-frontend
npm run build
```

This creates an optimized production build in the `dist/` directory. The build includes:

- Minified JavaScript bundles
- Optimized CSS
- Static assets with content hashing for cache busting

You can preview the production build locally:

```bash
npm run preview
```

### Run the Backend in Production

For production, run the FastAPI backend with a production-grade ASGI server:

```bash
cd devin-dashboard-backend
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

> **Note:** Remove the `--reload` flag in production for better performance.

---

## 9. Troubleshooting

### The dashboard shows "Failed to fetch sessions"

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| Backend is not running                | Start the backend server (see [Section 4.1](#41-start-the-backend)) |
| Incorrect API URL                     | Check that `VITE_API_URL` points to the correct backend address |
| Network/firewall issues               | Ensure ports 8000 (backend) and 5173 (frontend) are not blocked |

### The dashboard loads but shows no sessions

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| Invalid or missing API token          | Verify your `DEVIN_API_TOKEN` in the `.env` file               |
| No Devin sessions exist               | Create a session in the Devin app first                        |
| User filter is active                 | Click "Clear all" to reset filters                             |

### The backend returns a 500 error

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| `DEVIN_API_TOKEN` not set             | Create a `.env` file with your token (see [Section 3.2](#32-backend-setup)) |
| Token is expired or revoked           | Generate a new token at [app.devin.ai/settings/api-keys](https://app.devin.ai/settings/api-keys) |

### CORS errors in the browser console

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| Backend not running on expected port  | Ensure the backend is running on port 8000                     |
| Frontend pointing to wrong URL        | Check `VITE_API_URL` configuration                             |

### `poetry install` fails

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| Python version too old                | Install Python 3.12 or higher                                  |
| Poetry not installed                  | Install Poetry: `curl -sSL https://install.python-poetry.org \| python3 -` |

### `npm install` fails

| Possible Cause                        | Solution                                                       |
|---------------------------------------|----------------------------------------------------------------|
| Node.js version too old               | Install Node.js 18 or higher                                  |
| Corrupted node_modules                | Delete `node_modules/` and `package-lock.json`, then re-run `npm install` |

---

## 10. FAQ

**Q: How often does the dashboard refresh automatically?**
A: Every 30 seconds. You can also click the Refresh button for an immediate update.

**Q: Can I see sessions from other users in my organization?**
A: Yes. By default, the dashboard shows sessions from all users. Use the user dropdown filter in the header to view sessions from a specific user.

**Q: How many sessions are displayed at once?**
A: The dashboard fetches up to 100 sessions per request. If you have more than 100 sessions, the most recent 100 will be shown.

**Q: Is my Devin API token secure?**
A: Yes. The API token is stored only on the backend server in the `.env` file and is never sent to or exposed in the browser. The frontend communicates only with your backend, which handles all Devin API authentication.

**Q: Can I deploy this dashboard for my team?**
A: Yes. Build the frontend for production (`npm run build`), serve the `dist/` folder via any static file server or CDN, and deploy the backend with a production ASGI server. Make sure to configure `VITE_API_URL` to point to your deployed backend URL before building.

**Q: What browsers are supported?**
A: The dashboard works in all modern browsers including Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.

**Q: Can I customize the dashboard appearance?**
A: The frontend uses Tailwind CSS for styling. You can modify colors, spacing, and layout by editing `tailwind.config.js` and the component files in `src/`. The UI components in `src/components/ui/` can also be customized.

**Q: How do I change the backend port?**
A: Change the `--port` argument when starting uvicorn. If you change the backend port, update `VITE_API_URL` in the frontend accordingly.
