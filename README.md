A minimal production-style pipeline showing how Data Quality validation protects AI-generated financial insights in a FinTech system.

# FinTech Data Quality + AI (CTO Report)

## Pipeline Overview
Database → Data Quality Validation → Structured JSON → AI Analysis → Executive Report

The AI never queries the database directly. It only consumes validated structured output produced by the DQ layer.

This project demonstrates a small FinTech-style data model (Customer / Account / Transfer / Transaction), a set of Data Quality (DQ) rules, a DQ-run logging schema (`dq_statistics`), and an AI step that converts the latest DQ run into a CTO-friendly Markdown report.

## Why this matters

In financial systems, dirty transactional data can propagate into:
- financial statements
- AI-generated insights
- regulatory reports

This project demonstrates how a data quality layer can act as a safety gate before AI consumption.

## Goal
Ensure only clean, validated financial data is used for AI summaries and financial reporting.

## What this project does
1. Seeds the database with valid + intentionally invalid demo records
2. Runs DQ checks and logs violations to `dq_statistics.failures` under a `dq_statistics.runs` runId
3. Builds a JSON summary of the latest run (`latest_run.json`)
4. Calls OpenAI and generates a CTO report (`cto_report_*.md`) based on that JSON
5. Ensures the AI only receives validated structured data (never raw transactional tables)

## Tech Stack
- PostgreSQL
- SQL (schema, seed data, DQ rules, dashboard queries)
- Node.js (pg + dotenv) for pipeline/report generation
- OpenAI API (Responses API)
- React (Vite) for dashboard UI
- Simple data visualizations (bar + donut charts)

## Repository Structure
- `db/`
  - `schema/` → tables
  - `seed/` → seed_demo.sql
  - `DQ/` → DQ rule queries + runner
  - `ai_inputs/` → SQL used by Node to read latest run
- `ai/`
  - `src/dq/` → buildLatestRunReport, getLatestRunData, etc.
  - `src/ai/` → promptBuilder, openaiClient, buildCtoReport, ruleDictionary
  - `src/utils/` → runSqlFile helper
- `frontend/`
  - `public/` → static inputs (`latest_run.json`, `cto_report.md`)
  - `src/components/` → Dashboard, charts, CTO report view
  - `src/utils/` → data loaders
  - Vite + React configuration
- `samples/reports/` → committed example outputs (safe, no secrets)

## Setup
### 1) Database
Create tables and schema in PostgreSQL using the SQL files inside `db/`.

### 2) Seed demo data
Run the seed script to insert valid and intentionally invalid rows.

### 3) Run DQ runner
Execute the single-run DQ runner SQL. This creates one row in `dq_statistics.runs` and logs failures.

### 4) AI pipeline
The AI pipeline reads the latest run using SQL in `db/ai_inputs/`, builds `ai/reports/latest_run.json`, then calls OpenAI to generate `ai/reports/cto_report_*.md`.

## Environment Variables
Create `ai/.env`:

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=postgres

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

> `.env` is ignored by git. Never commit secrets.

## Run (Demo)
### Install dependencies
```bash
cd ai
npm install
```

### 1) Generate `latest_run.json` (reads DB + writes `ai/reports/latest_run.json`)
```bash
node src/dq/buildLatestRunReport.js
```

### 2) Generate CTO report (reads `latest_run.json` + calls OpenAI + writes `ai/reports/cto_report_*.md`)
```bash
node src/ai/buildCtoReport.js
```

### Run the full pipeline in one command (recommended)
If you have `ai/src/pipeline/runPipeline.js`, run:
```bash
node src/pipeline/runPipeline.js
```

> Tip: you can also expose this as an npm script (e.g., `npm run pipeline`) once you add it to `ai/package.json`.

## Full Demo Flow (End-to-End)

```bash
cd ai
npm install

# Option A (single command): end-to-end pipeline
node src/pipeline/runPipeline.js

# Option B (manual steps)
node src/dq/buildLatestRunReport.js
node src/ai/buildCtoReport.js
```

## Frontend Dashboard

The project includes a React (Vite) dashboard that visualizes:

- Latest DQ run summary
- Failures by Rule (bar chart)
- Failures by Entity Type (bar + donut distribution)
- Example Violations
- AI-generated CTO report (rendered from Markdown)

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:
http://localhost:5173

### Frontend Data Requirement

Before starting the frontend, ensure:

- `ai/reports/latest_run.json` exists
- `ai/reports/cto_report_*.md` exists

Copy them into:

```bash
frontend/public/latest_run.json
frontend/public/cto_report.md
```

The dashboard reads these static files and does not call the database directly.

## Sample Outputs
- `samples/reports/latest_run.sample.json`
- `samples/reports/cto_report.sample.md`

## Troubleshooting
- `relation "dq_statistics.runs" does not exist`
  → Schema not created yet

- `OPENAI_API_KEY is missing`
  → Add it to `ai/.env` and rerun

- `429 / insufficient_quota`
  → Add billing or increase quota in OpenAI platform

## EER Diagram (v1)
![EER v1](docs/diagrams/eer_v1.jpg)
The schema intentionally mimics a simplified banking ledger structure to demonstrate real-world data quality and reconciliation scenarios.