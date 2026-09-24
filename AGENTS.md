# Bejir — Agent Instructions

## 1. Project Overview

Bejir is a **WebGIS Banjir Jawa Barat — a web-based Geographic Information System platform for integrating and presenting flood event, condition, and risk information for West Java Province, Indonesia, in a single interactive platform**.

The system integrates spatial and non-spatial flood-related data, including flood event history, rainfall, river networks, elevation, slope, land use / land cover, administrative boundaries, population, and buildings, which are processed and visualized as various layers on an interactive map so users can understand relationships between geographic conditions, rainfall, and flood events / susceptibility.

### Core capabilities

- Historical flood event visualization and information
- Rainfall distribution visualization and analysis
- Regional information and statistics by administrative region
- Geographic and topographic parameter analysis (elevation, slope, land cover, river networks)
- Flood susceptibility analysis using spatial and hydrometeorological parameters
- Flood impact potential analysis for population and buildings (impact estimator)
- Flood prediction based on available parameters and data
- Scenario-based inundation simulation (inundation extent)
- Nearest evacuation route search / evacuation route analysis
- Interactive spatial data visualization (interactive map + dashboard with comparable layers)
- 3D visualization
- Bejir AI ChatBot as flood information assistant
- Administrative data management

Rainfall is used as a hydrometeorological parameter in flood susceptibility analysis. It may be processed through normalization or reclassification before being combined with other parameters using the defined analysis method. Method, period, units, classification, and weights for rainfall follow dataset characteristics and research decisions and must not be set arbitrarily by the system.

### Scope

Scope covers spatial data processing and analysis for West Java Province to support flood monitoring and mitigation: flood prediction, inundation extent simulation, flood impact estimation for population and buildings, nearest evacuation route search, flood history mapping, and the Bejir AI ChatBot. The system provides an interactive map and dashboard with geographic layers for flood history, rainfall, river networks, elevation, slope, land use, administrative boundaries, buildings, and population, filterable by region and time period supported by the dataset. Development scope includes spatial database (PostgreSQL + PostGIS), backend API, WebGIS frontend, AI ChatBot integration, testing, and deployment.

Bejir is a **monorepo**.

---

# 2. Repository Structure

```text
bejir/
│
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # FastAPI backend
│
├── ai/
│   └── bejir/                # Bejir AI assistant
│
├── gis/
│   ├── qgis/                 # QGIS projects, styles, processing
│   └── scripts/              # GIS/data processing scripts
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
└── .github/
    └── workflows/
```

Do not move responsibilities between these directories without a concrete architectural reason.

When a directory contains its own `AGENTS.md`, follow both this root instruction and the more specific local instruction.

---

# 3. Technology Stack

## Frontend

- Next.js
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
- Python GIS tooling when appropriate

## AI

- Bejir AI assistant
- LLM
- Retrieval/tool-based architecture where appropriate

## Infrastructure

- Docker
- Nginx
- GitHub Actions

Use the existing stack whenever possible.

Do not introduce a new framework, library, database, ORM, or infrastructure technology without a concrete reason.

---

# 4. Core Engineering Principles

Follow these principles throughout the project.

1. Prefer simple solutions over unnecessary abstraction.
2. Prefer existing project patterns over introducing new patterns.
3. Do not duplicate business logic.
4. Keep responsibilities separated.
5. Make changes as small and focused as reasonably possible.
6. Do not modify unrelated code.
7. Do not rewrite working code merely for stylistic preference.
8. Do not introduce dependencies without justification.
9. Consider scalability when working with large spatial datasets.
10. Preserve data integrity.
11. Never commit secrets or credentials.
12. Never commit large raw datasets.
13. Prefer reproducible data processing.
14. Treat existing architecture as intentional unless evidence indicates otherwise.

---

# 5. Architecture

Bejir follows a layered architecture.

The general backend flow is:

```text
HTTP Request
     ↓
API Router
     ↓
Request Validation
     ↓
Service
     ↓
Repository / Spatial Layer
     ↓
PostgreSQL + PostGIS
     ↓
Service
     ↓
Response Schema
     ↓
HTTP Response
```

## Router

Routers are responsible for:

- HTTP endpoints
- request parameters
- authentication/dependencies
- invoking services
- returning responses

Routers should remain thin.

Do not put substantial business logic or complex database queries inside routers.

## Service

Services contain:

- business logic
- application workflows
- calculations
- orchestration between repositories
- coordination between database and external services

## Repository

Repositories are responsible for:

- database access
- query construction
- persistence
- retrieving domain data

Do not place business decisions inside repositories.

## Spatial Layer

Spatial operations should be isolated when they become sufficiently complex.

Examples:

- spatial intersection
- proximity analysis
- buffering
- nearest-feature queries
- spatial joins
- geometry calculations
- routing-related spatial operations

Use PostGIS whenever the operation can be efficiently performed in the database.

---

# 6. Backend Rules

The backend uses FastAPI.

Preferred structure:

```text
apps/api/app/
├── api/
│   └── v1/
├── core/
├── models/
├── schemas/
├── repositories/
├── services/
├── spatial/
└── main.py
```

## API Versioning

API endpoints should be versioned.

Example:

```text
/api/v1/floods
/api/v1/population
/api/v1/buildings
/api/v1/evacuation
```

Do not silently introduce breaking changes to existing endpoints.

If a breaking API change is necessary, evaluate whether a new API version is appropriate.

## Validation

Use Pydantic schemas for request and response validation.

Do not expose database models directly as API contracts unless there is a deliberate reason.

## Error Handling

Use appropriate HTTP status codes.

Do not expose internal stack traces, SQL errors, secrets, or implementation details to API consumers.

Errors should have a predictable response structure.

## Dependency Injection

Use FastAPI dependency injection for concerns such as:

- database sessions
- authentication
- authorization
- reusable request-level dependencies

Do not use `Depends()` merely to hide ordinary business logic.

---

# 7. Database Rules

Bejir uses:

```text
PostgreSQL + PostGIS
```

The database is a core part of the system.

Schema changes must be reproducible.

Use migrations for:

- tables
- columns
- indexes
- constraints
- extensions
- database functions
- views where supported by the migration system

Do not rely on manually modifying a local database.

## Spatial Database

Use PostGIS for spatial operations whenever appropriate.

Examples include:

```text
ST_Intersects
ST_Within
ST_Contains
ST_DWithin
ST_Distance
ST_Buffer
```

Use spatial indexes where appropriate, especially for large spatial tables.

Always consider query performance against the actual dataset size.

Important datasets currently include approximately:

- 2,245 flood events
- 8,159,488 buildings
- 859,716 roads
- 114,304 rivers
- 17 land-cover classes
- population data for 27 regencies/cities across multiple years

Do not assume a spatial query that works on a small sample will scale to the complete dataset.

---

# 8. GIS Rules

QGIS is a required component of Bejir.

QGIS should be treated as part of the system architecture, not merely a visualization tool.

## CRS

Always identify:

- source CRS
- processing CRS
- destination CRS

Do not blindly use EPSG:4326 for calculations involving:

- distance
- area
- buffering
- spatial measurements

Use an appropriate projected CRS when metric calculations are required.

## Spatial Processing

Prefer database-side processing with PostGIS for large datasets when practical.

Do not load millions of geometries into Python simply because a Python implementation is easier.

## Data Processing

GIS processing should be reproducible.

Document:

- data source
- acquisition date
- CRS
- transformation
- preprocessing
- filtering
- output format
- destination table/layer

---

# 9. Data Rules

The repository may contain metadata and small development samples, but should not contain large raw datasets.

Use:

```text
data/
├── raw/
├── processed/
└── samples/
```

Large datasets must not be committed to Git.

Raw datasets should be treated as immutable.

Do not overwrite the original source data during preprocessing.

Prefer:

```text
raw
  ↓
processing
  ↓
processed
  ↓
PostGIS
```

rather than modifying raw files directly.

Every important dataset should have documented provenance.

---

# 10. Frontend Rules

The frontend uses:

- Next.js
- TypeScript
- Leaflet
- OpenStreetMap

## Components

Components should have clear responsibilities.

Avoid giant components containing:

- UI
- API calls
- business logic
- map logic
- state management

all at once.

Separate concerns when complexity grows.

## API Communication

Do not scatter API calls throughout unrelated UI components.

Use an appropriate service/data-access layer.

Keep API contracts explicit.

## TypeScript

Prefer strong typing.

Avoid `any` unless there is a documented technical reason.

Do not duplicate types unnecessarily.

## Maps

Map-related logic should remain isolated from unrelated UI logic.

Be careful with:

- Leaflet initialization
- layer lifecycle
- event listeners
- map cleanup
- large GeoJSON datasets

Do not render unnecessarily large datasets directly in the browser when server-side spatial filtering or tiling is more appropriate.

---

# 11. AI / Bejir Rules

Bejir is the AI assistant inside Bejir.

Bejir should primarily provide information grounded in Bejir's available data and capabilities.

## Grounding

Do not fabricate:

- flood events
- geographic locations
- evacuation points
- population statistics
- building counts
- spatial analysis results
- official information

When reliable Bejir data is available, prefer retrieved data over unsupported model knowledge.

## Distinguish Information Types

Bejir must distinguish between:

```text
Historical Data
Calculated Analysis
Model Prediction
Simulation Result
User-provided Information
```

Do not present predictions or simulations as confirmed historical facts.

## Architecture

Prefer a flow conceptually similar to:

```text
User
 ↓
API
 ↓
Bejir Service
 ↓
Retrieval / Tools
 ↓
PostgreSQL / PostGIS
 ↓
LLM
 ↓
Response
```

Do not put database credentials, system secrets, or unrestricted database access into prompts.

---

# 12. Security

Never commit:

- API keys
- passwords
- database credentials
- JWT secrets
- private keys
- `.env` files containing secrets
- production credentials

Use environment variables.

Provide `.env.example` with placeholder values.

Never log sensitive credentials.

Never return secrets through API responses.

Authentication and authorization must be enforced server-side.

Never rely solely on frontend checks for authorization.

---

# 13. Performance

Performance decisions must consider Bejir's spatial workload.

Pay particular attention to:

- 8M+ buildings
- 800K+ roads
- 100K+ rivers
- spatial joins
- map rendering
- GeoJSON payload size
- database indexes
- repeated spatial queries

Before optimizing prematurely, identify the actual bottleneck.

Before implementing an expensive spatial operation, consider:

1. Can PostGIS perform it?
2. Is there an appropriate spatial index?
3. Can the query filter the geographic area first?
4. Can the result be aggregated server-side?
5. Does the frontend actually need every geometry?

Avoid transferring millions of geometries to the browser.

---

# 14. Testing

New non-trivial functionality should include appropriate tests.

## Backend

Use tests for:

- services
- repositories where appropriate
- API endpoints
- spatial logic
- important edge cases

## Frontend

Test:

- important user flows
- critical components
- API integration behavior

## GIS

For important GIS processing, verify:

- CRS
- geometry validity
- expected feature counts
- spatial relationships
- output schema

A successful script execution does not necessarily mean the GIS result is correct.

---

# 15. Development Workflow

Before implementing a task:

1. Read the relevant instructions.
2. Inspect the existing code.
3. Identify the relevant architecture.
4. Search for existing implementations.
5. Determine dependencies.
6. Determine the smallest appropriate change.
7. Implement the change.
8. Run relevant tests/checks.
9. Review the resulting diff.
10. Report what changed.

Do not immediately start writing code before understanding the existing implementation.

---

# 16. Existing Code First

Before creating a new:

- service
- repository
- component
- utility
- hook
- schema
- database query
- API endpoint

search the repository for an existing implementation that may already solve the problem.

Reuse existing abstractions when appropriate.

Do not create duplicate utilities simply because the existing one has a different name.

---

# 17. Change Scope

Keep changes focused.

If the task is:

```text
Add flood statistics endpoint
```

do not simultaneously:

- redesign the API architecture
- rewrite unrelated services
- change frontend architecture
- rename unrelated files
- upgrade dependencies
- refactor the entire database layer

unless those changes are necessary for the requested functionality.

If a larger architectural problem is discovered, explain it separately instead of silently expanding the scope.

---

# 18. Dependency Rules

Before adding a dependency:

1. Check whether the functionality already exists in the project.
2. Check whether the standard library can solve it.
3. Check whether an existing dependency already provides the capability.
4. Consider maintenance and security.
5. Add the dependency only when justified.

Do not add libraries merely for convenience.

---

# 19. Git Rules

Never commit directly to `main`.

Use feature branches.

Recommended naming:

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
feature/bejir-rag
fix/map-layer-loading
docs/database-schema
```

Recommended commit format:

```text
feat(scope): description
fix(scope): description
refactor(scope): description
docs(scope): description
test(scope): description
chore(scope): description
```

Keep commits logically focused.

Do not include unrelated changes in the same commit.

---

# 20. Pull Requests

A pull request should clearly communicate:

- what changed
- why it changed
- affected components
- database changes
- API changes
- testing performed
- known limitations

If an API contract changes, explicitly document the change.

If a database schema changes, include the migration.

If a GIS workflow changes, update the relevant documentation.

---

# 21. Environment and Local Development

Never assume that another developer has the same environment.

Document required services and configuration.

Prefer Docker for project infrastructure such as databases and supporting services.

Local environment configuration should use:

```text
.env
```

while the repository contains:

```text
.env.example
```

Never commit the actual `.env`.

---

# 22. Documentation

Important architectural decisions should be documented.

Use:

```text
docs/
├── architecture/
├── api/
├── database/
├── gis/
├── requirements/
├── deployment/
└── decisions/
```

Use Architecture Decision Records when a significant architectural choice is made.

Examples:

```text
ADR-001-postgis.md
ADR-002-fastapi.md
ADR-003-monorepo.md
```

Documentation should explain **why**, not only **what**.

---

# 23. When Requirements Are Ambiguous

Do not guess when ambiguity can materially affect:

- architecture
- database schema
- API contracts
- security
- data integrity
- GIS methodology
- AI behavior

Ask for clarification when necessary.

For small implementation details, use the existing project conventions and make the smallest reasonable assumption.

When making a non-trivial assumption, state it clearly.

---

# 24. Do Not Hallucinate Project State

Never claim that:

- an endpoint exists when it does not
- a dataset exists when it has not been verified
- a migration has been applied when it has not
- a test passed when it was not run
- a deployment succeeded when it was not verified
- a GIS analysis is correct without checking its result

Inspect the repository and verify before making such claims.

---

# 25. Definition of Done

A task is not considered complete merely because code has been written.

Before considering a task complete:

- implementation is finished
- relevant tests are added or updated
- relevant tests/checks have been run
- formatting/linting has been checked
- type checking has been checked where applicable
- migrations are included where applicable
- documentation is updated when necessary
- no secrets are introduced
- no large datasets are committed
- unrelated files are not modified unnecessarily
- the final diff has been reviewed

---

# 26. Agent Response Format

When completing a coding task, provide a concise summary containing:

## Changed

What was implemented.

## Files

Important files created or modified.

## Verification

Tests, linting, type checking, or other verification performed.

## Notes

Important assumptions, limitations, or follow-up work.

Do not provide a long explanation of code that was not requested.

Focus on the actual changes and their consequences.
