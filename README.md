<div align="center">

# ⚡ INVICTUS

### Enterprise PCB Consumption Analytics & Manufacturing Inventory Management

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  A full-stack manufacturing intelligence platform tailored for electronics assembly lines, PCB manufacturing units, Bill of Materials (BOM) management, automated stock depletion, and proactive procurement triggers.
</p>

[Key Features](#-key-features) • [Architecture](#-architecture) • [Database Schema](#-database-schema) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Demo Credentials](#-demo-credentials)

---

</div>

## 📌 Overview

In printed circuit board (PCB) assembly and electronics hardware manufacturing, tracking component inventory against dynamic production batches is critical. Stockouts cause expensive assembly line halts, while excess stock ties up working capital.

**Invictus** solves this challenge by providing an end-to-end management and analytics engine:
- Connects your **Bill of Materials (BOM)** to live inventory stocks.
- Automatically calculates and deducts component stock whenever a batch production run is registered.
- Issues automated **Procurement Triggers** when component levels breach safety thresholds.
- Integrates a high-performance **Spreadsheet Analytics Engine** capable of parsing, storing, and visualizing multi-sheet Excel files directly in PostgreSQL.

---

## ✨ Key Features

### 1. 📦 Component Inventory Management
- Centralized tracking of components by Part Number (`MPN`), Name, Description, Stock Quantity, Monthly Demand, and Low-Stock Reorder Thresholds.
- Real-time stock status badges (Healthy, Warning, Critical).
- Bulk inventory ingestion via Excel (`.xlsx`) spreadsheets with validation.

### 2. 🧩 PCB & Bill of Materials (BOM) Mapping
- Define distinct PCB designs (e.g., Control Boards, Power Supplies, Sensor Modules).
- Map required component quantities per unit board.
- Maintain accurate BOM relationships with referential integrity.

### 3. 🏭 Production Runs & Auto-Consumption Engine
- Register production batches with designated batch sizes.
- **Atomic Stock Deduction**: Automatically verifies stock availability and deducts components in real time.
- Records detailed transaction audit trails (`inventory_transactions`) capturing stock levels before and after each run.

### 4. 🚨 Automated Procurement Triggers
- Automatic flag creation whenever component quantities fall below safety thresholds.
- Streamlined procurement workflow (`pending` ➔ `ordered` ➔ `fulfilled`).
- Prevents stock-outs before planned production schedules are affected.

### 5. 📊 Excel Viewer & Dynamic Analytics Platform
- Upload multi-sheet `.xlsx` files into PostgreSQL JSONB rows.
- Dynamic data table inspection, filtering, and aggregation.
- Visual metric charts powered by Recharts (consumption curves, demand forecasting, stock runout estimates).

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│   (Tailwind CSS v4 • Recharts • Lucide • Framer Motion) │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (Axios)
┌───────────────────────────▼────────────────────────────┐
│                    Node.js + Express                   │
│   (JWT Auth • Multer • ExcelJS / SheetJS • pg Pool)    │
└───────────────────────────┬────────────────────────────┘
                            │ Connection Pool (SSL ready)
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│  (Relational Schema + JSONB for Dynamic Spreadsheet)   │
└────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v7, Tailwind CSS v4, Recharts, Framer Motion, Lucide React, Axios |
| **Backend** | Node.js, Express.js, Multer (file uploads), ExcelJS & XLSX (data processing), JWT & bcrypt |
| **Database** | PostgreSQL with indexed relational tables & JSONB storage |

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS ||--o{ PRODUCTION_RUNS : "initiates"
    USERS ||--o{ EXCEL_FILES : "uploads"
    
    PCBS ||--|{ PCB_COMPONENTS : "contains"
    COMPONENTS ||--|{ PCB_COMPONENTS : "mapped in"
    
    PCBS ||--o{ PRODUCTION_RUNS : "manufactured in"
    PRODUCTION_RUNS ||--|{ INVENTORY_TRANSACTIONS : "logs"
    COMPONENTS ||--|{ INVENTORY_TRANSACTIONS : "consumed from"
    
    COMPONENTS ||--o{ PROCUREMENT_TRIGGERS : "triggers"

    EXCEL_FILES ||--|{ EXCEL_SHEETS : "contains"
    EXCEL_SHEETS ||--|{ EXCEL_ROWS : "stores data in"

    USERS {
        int id PK
        string username UK
        string password_hash
        string role
    }

    COMPONENTS {
        int id PK
        string part_number UK
        string name
        text description
        int stock_quantity
        int monthly_demand
        int low_stock_threshold
        timestamp created_at
    }

    PCBS {
        int id PK
        string pcb_name UK
        text description
        timestamp created_at
    }

    PCB_COMPONENTS {
        int id PK
        int pcb_id FK
        int component_id FK
        int quantity_per_pcb
    }

    PRODUCTION_RUNS {
        int id PK
        int pcb_id FK
        int quantity_produced
        int user_id FK
        timestamp timestamp
    }

    INVENTORY_TRANSACTIONS {
        int id PK
        int production_run_id FK
        int component_id FK
        int quantity_used
        int stock_before
        int stock_after
        string transaction_type
        timestamp created_at
    }

    PROCUREMENT_TRIGGERS {
        int id PK
        int component_id FK
        timestamp trigger_date
        string status
    }

    EXCEL_FILES {
        int id PK
        string original_filename
        int file_size
        int total_sheets
        int uploaded_by FK
        timestamp uploaded_at
    }

    EXCEL_SHEETS {
        int id PK
        int file_id FK
        string sheet_name
        int row_count
        jsonb column_headers
    }

    EXCEL_ROWS {
        int id PK
        int sheet_id FK
        int row_number
        jsonb data
    }
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (v9+)
- [PostgreSQL](https://www.postgresql.org/) (v14+ local instance or hosted on Supabase / Neon / Render)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/luvya-svj/invictus.git
cd invictus
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration
Copy the template and fill in your PostgreSQL credentials:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# Option A: Full Connection URL (Neon, Render, Supabase)
# DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Option B: Local PostgreSQL instance
DB_USER=postgres
DB_HOST=localhost
DB_NAME=invictus_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432

JWT_SECRET=your_super_secret_jwt_key
```

#### Frontend Configuration
Copy the template for frontend:
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 3: Install Dependencies
You can install dependencies for both services at once:
```bash
npm run install:all
```
*(Or individually: `cd backend && npm install`, then `cd frontend && npm install`)*

---

### Step 4: Initialize & Seed Database

Ensure your PostgreSQL service is running and create the database if it doesn't exist:
```sql
CREATE DATABASE invictus_db;
```

Then run the automated seed script to populate tables, BOM mappings, and demo data:
```bash
npm run db:demo
```
> **Note:** Alternatively, to create empty schema tables without mock data, run `npm run db:init`.

---

### Step 5: Start the Development Servers

Open two terminal sessions:

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Server runs on http://localhost:5000
# Health check available at http://localhost:5000/api/health
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Client runs on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Demo Credentials

The database seeder provisions a default administrator account:

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@1234` | `admin` |

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`operator` or `admin`) | No |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT token | No |

### Inventory & Components
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/components` | Retrieve all inventory components | Yes |
| `POST` | `/api/components` | Create a single component | Yes |
| `PUT` | `/api/components/:id` | Update component stock or parameters | Yes |
| `POST` | `/api/components/import` | Upload `.xlsx` file to batch import components | Yes |
| `DELETE` | `/api/components` | Clear all components from inventory | Yes |

### PCB & BOM Mapping
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/pcbs` | List all registered PCB models | Yes |
| `POST` | `/api/pcbs` | Register a new PCB model | Yes |
| `GET` | `/api/pcbs/:pcbId/components` | Get component Bill of Materials for a PCB | Yes |
| `POST` | `/api/pcbs/:pcbId/components` | Map components and quantities to a PCB | Yes |

### Production Runs
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/production` | Register production batch (deducts stock & logs run) | Yes |
| `GET` | `/api/production/history` | List all historical production runs | Yes |
| `GET` | `/api/production/history/:id` | View detailed component consumption breakdown | Yes |

### Procurement Triggers
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/procurement/triggers` | View components that breached low-stock threshold | Yes |
| `POST` | `/api/procurement/triggers/:id/fulfill` | Mark procurement trigger as ordered/fulfilled | Yes |

### Spreadsheet & Analytics
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/excel/upload` | Upload multi-sheet `.xlsx` file | Yes |
| `GET` | `/api/excel/files` | List all uploaded spreadsheets | Yes |
| `GET` | `/api/excel/files/:fileId/sheets` | List sheets within an uploaded workbook | Yes |
| `GET` | `/api/excel/sheets/:sheetId/rows` | Fetch paginated tabular rows | Yes |
| `GET` | `/api/excel/sheets/:sheetId/analytics` | Compute numerical summaries and statistics | Yes |
| `GET` | `/api/analytics/dashboard` | High-level KPI metrics and consumption totals | Yes |
| `GET` | `/api/health` | Service and database connectivity check | No |

---

## 📂 Repository Structure

```
invictus/
├── backend/
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection pool with SSL handling
│   ├── controllers/
│   │   ├── analyticsController.js # Aggregations and dashboard KPIs
│   │   ├── authController.js      # User registration, login, JWT issuance
│   │   ├── excelController.js     # Spreadsheet parsing and JSONB queries
│   │   ├── inventoryController.js # Component CRUD and Excel bulk import
│   │   ├── pcbController.js       # PCB definition and BOM mapping
│   │   ├── procurementController.js # Trigger detection & fulfillment
│   │   └── productionController.js  # Batch execution & atomic stock deduction
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT token verification
│   │   └── uploadMiddleware.js    # Multer memory storage configuration
│   ├── routes/
│   │   └── api.js                 # Centralized Express API routing
│   ├── scripts/
│   │   ├── initDb.js              # Schema initialization script
│   │   ├── setupDemo.js           # Enterprise dataset seeder
│   │   └── createExcelTables.js   # Standalone Excel table creator
│   ├── server.js                  # Express application entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI modals, navigation, toasts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Primary operations dashboard
│   │   │   ├── Inventory.jsx      # Component stock management
│   │   │   ├── Mapping.jsx        # PCB BOM mapping interface
│   │   │   ├── Production.jsx     # Production run execution & logs
│   │   │   ├── Procurement.jsx    # Low-stock trigger management
│   │   │   └── AnalyticsPlatform.jsx # Spreadsheet viewer & data charts
│   │   ├── services/
│   │   │   └── api.js             # Axios client with interceptors
│   │   ├── App.jsx                # Route declarations
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── vite.config.js             # Vite configuration with API proxy
│   └── package.json
│
├── .gitignore
├── package.json                   # Root orchestrator scripts
└── README.md                      # Comprehensive project documentation
```

---

## 🚢 Deployment Notes

### Backend (Render / Railway / Fly.io)
1. Set the root directory or build command to `cd backend && npm install`.
2. Start command: `node server.js`.
3. Provide environment variables in your cloud provider's dashboard:
   - `DATABASE_URL` (with SSL enabled)
   - `JWT_SECRET`
   - `NODE_ENV=production`

### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Set base directory to `frontend`.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Environment variable: `VITE_API_URL=https://your-backend-domain.com/api`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
