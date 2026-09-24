# Bejir

> **Flood Intelligence & Evacuation Assistant for West Java**

Bejir is a geospatial information and decision-support platform designed to provide flood intelligence for **West Java, Indonesia**.

Bejir combines **geospatial data, spatial analysis, flood information, impact analysis, evacuation routing, and AI-assisted interaction** into a single platform.

---

## Overview

Flood information is often distributed across different datasets, maps, and information sources. This makes it difficult to obtain a unified understanding of:

- where flooding has occurred;
- which areas are potentially affected;
- how many people and buildings may be impacted;
- how geographic characteristics relate to flood risk;
- where evacuation locations are located;
- how to reach an evacuation location efficiently.

Bejir is designed to integrate these capabilities into one geospatial platform.

---

## Core Features

### Flood Intelligence

Provide historical and analytical information about flood events in West Java.

- Historical flood events
- Flood statistics
- Spatial distribution of flood events
- Administrative-level analysis
- Flood-related geographic information

### Spatial Impact Analysis

Analyze potential impacts of flooding using spatial relationships between datasets.

- Population impact
- Building impact
- River proximity
- Land-cover analysis
- Administrative area analysis
- Geographic characteristics

### Terrain Analysis

Use elevation-derived information to support flood analysis.

- Elevation
- Slope
- Terrain characteristics

### Flood Risk & Prediction

Provide analytical and model-based information related to flood risk.

The system distinguishes between:

- historical observations;
- calculated spatial analysis;
- model predictions;
- simulations.

Predictions and simulations are not presented as confirmed historical events.

### Inundation Simulation

Support analysis of potential inundation areas using available geographic and environmental data.

### Evacuation

Provide evacuation-related spatial analysis.

- Evacuation locations
- Nearest evacuation point
- Route analysis
- Distance analysis
- Spatial accessibility

### AI Assistant

Bejir is designed to provide an AI-assisted interface for interacting with flood-related information.

The AI layer can retrieve and reason over relevant Bejir data instead of relying solely on general-purpose model knowledge.

---

# Technology Stack

## Frontend

- [Next.js](https://nextjs.org/)
- TypeScript
- Leaflet
- OpenStreetMap

## Backend

- Python
- FastAPI
- Pydantic
- PostgreSQL
- PostGIS

## GIS

- QGIS
- PostGIS
- Python-based geospatial processing where appropriate

## AI

- LLM-based assistant
- Retrieval/tool-based architecture
- Spatial and database-backed information retrieval

## Infrastructure

- Docker
- Nginx
- GitHub Actions

---

# Repository Structure

```text
bejir/
│
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # FastAPI backend
│
├── ai/
│   └── assistant/              # AI assistant
│
├── gis/
│   ├── qgis/                   # QGIS projects and styles
│   └── scripts/                # GIS/data processing
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── functions/
│   └── views/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── samples/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── gis/
│   ├── requirements/
│   ├── deployment/
│   └── decisions/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── terraform/
│   └── ansible/
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── docker-compose.yml
├── .env.example
├── CONTRIBUTING.md
└── README.md
```

For detailed coding-agent instructions, see [`AGENTS.md`](AGENTS.md).

---

# Data

Bejir integrates multiple geospatial and non-spatial datasets.

Current datasets include approximately:

| Dataset      | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| Flood Events | 2,245 flood events, 2008–2026                                 |
| Population   | Population data for 27 regencies/cities across multiple years |
| Buildings    | ~8.16 million building features                               |
| Roads        | ~859,000 road features                                        |
| Rivers       | ~114,000 river features                                       |
| Land Cover   | 17 land-cover classes                                         |

Additional datasets are being prepared for:

- Elevation / DEM
- Slope
- Rainfall
- Public facilities
- Evacuation points

Large datasets are **not stored directly in Git**.

Dataset provenance, preprocessing, CRS, and processing workflows should be documented in the `docs/gis/` directory.

---

# GIS & Spatial Analysis

Bejir uses **PostGIS** as the primary spatial database engine.

Typical spatial operations include:

```text
ST_Intersects
ST_Within
ST_Contains
ST_DWithin
ST_Distance
ST_Buffer
```

Spatial analysis may include:

```text
Flood Event
     │
     ├── Administrative Area
     ├── Population
     ├── Buildings
     ├── Rivers
     ├── Land Cover
     ├── Elevation
     └── Evacuation Points
```

Large spatial operations should preferably be performed by PostGIS rather than transferring large datasets into application memory.

QGIS is used for GIS workflows, visualization, processing, and spatial-data preparation where appropriate.

---

# Development

## Prerequisites

Recommended development environment:

- Git
- Docker
- Docker Compose
- Node.js
- Python
- PostgreSQL/PostGIS knowledge
- QGIS for GIS-related development

---

## Clone Repository

```bash
git clone https://github.com/<organization>/bejir.git
cd bejir
```

---

## Environment Configuration

Create a local environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

Never commit `.env`.

---

## Start Development Services

```bash
docker compose up -d
```

Check the status:

```bash
docker compose ps
```

The exact development commands for the frontend and backend are documented inside their respective application directories.

---

# Development Workflow

Bejir uses a feature-branch workflow.

```text
feature/*
     │
     ▼
Pull Request
     │
     ▼
develop
     │
     ▼
main
```

Recommended branch naming:

```text
feature/<name>
fix/<name>
refactor/<name>
docs/<name>
test/<name>
chore/<name>
```

Examples:

```text
feature/flood-impact-analysis
feature/evacuation-routing
feature/bejir-assistant
fix/map-layer-loading
```

Do not commit directly to `main`.

---

# Project Documentation

Detailed documentation is organized under `docs/`.

```text
docs/
├── architecture/     # System architecture
├── api/               # API documentation
├── database/          # Database and PostGIS
├── gis/               # GIS workflows and datasets
├── requirements/      # Functional and non-functional requirements
├── deployment/       # Deployment documentation
└── decisions/        # Architecture Decision Records
```

The project specification is maintained separately from coding-agent instructions.

- `README.md` — project overview
- `AGENTS.md` — coding-agent rules
- `docs/PROJECT.md` — detailed project specification

---

# Engineering Principles

Bejir follows several core engineering principles:

1. Keep the architecture modular.
2. Keep API routers thin.
3. Put business logic in services.
4. Keep database access in repositories.
5. Use PostGIS for large-scale spatial operations.
6. Keep GIS processing reproducible.
7. Do not commit large datasets.
8. Do not commit secrets.
9. Avoid unnecessary dependencies.
10. Prefer small, reviewable changes.
11. Test important behavior.
12. Document significant architectural decisions.

---

# Project Status

Bejir is currently under active development.

### Implemented / available

- Project architecture
- PostgreSQL/PostGIS direction
- Administrative data
- Historical flood-event data
- Population data
- Building data
- Road data
- River data
- Land-cover data
- QGIS integration direction
- Spatial-analysis architecture

### In development

- Elevation and slope data
- Rainfall integration
- Flood-risk analysis
- Flood prediction
- Inundation simulation
- Population/building impact analysis
- Evacuation routing
- AI assistant
- Frontend map and dashboard integration
- Production deployment

---

# Team

Bejir is developed as a collaborative software and GIS project.

The project team consists of:

- Project Manager
- Backend Developer
- Frontend Developer
- System Analyst
- GIS Developer

---

# License

This project is currently developed for academic and research purposes.

License information will be added when the project's distribution terms are finalized.
