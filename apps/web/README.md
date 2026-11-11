This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Frontend Organization

Bejir's frontend follows the GIS goals and module boundaries in [DESIGN.md](../../DESIGN.md). The folders below are scaffolding; they do not indicate that the features have been implemented.

```text
apps/web/
├── app/                       # Routes and page-local UI
│   ├── page.tsx               # / — landing entry
│   ├── landing/
│   │   ├── page.tsx           # /landing — same landing page
│   │   └── _components/       # Landing-only components
│   ├── map/page.tsx           # /map — interactive map
│   ├── histori-banjir/page.tsx # /histori-banjir
│   ├── curah-hujan/page.tsx   # /curah-hujan
│   └── analisis/page.tsx      # /analisis
├── components/
│   ├── ui/                    # Shared shadcn building blocks
│   ├── layout/                # Navigation and app shell
│   └── shared/                # General feedback and reusable UI
├── features/
│   ├── webgis/                # Workspace composition and shared filters
│   ├── map/                   # Leaflet rendering and lifecycle
│   ├── regions/               # Region selection and information
│   ├── floods/                # Historical events and statistics
│   ├── rainfall/              # Rainfall presentation
│   ├── geography/             # Terrain and supporting geographic layers
│   ├── susceptibility/        # Susceptibility analysis presentation
│   ├── impact/                # Population and building impact estimates
│   ├── prediction/            # Model prediction workflows
│   ├── inundation/            # Inundation simulation workflows
│   ├── evacuation/            # Evacuation locations and route results
│   ├── assistant/             # Bejir chat interface
│   └── admin/                 # Authorized data-management interface
├── lib/
│   └── api/                   # Shared HTTP transport and error handling
├── config/                    # Navigation and presentation configuration
├── mocks/                     # Small, labeled synthetic fixtures
└── public/                    # Non-icon static assets when needed
```

Empty folders contain `.gitkeep` placeholders so Git retains the structure. Remove a placeholder when adding real files to that folder. Add feature-local `components/`, hooks, `api.ts`, and `types.ts` only as needed; avoid empty implementation stubs.

The WebGIS workspace connects domain features. The map feature owns rendering mechanics, while each domain feature owns its data access and presentation meaning. Large datasets and spatial calculations remain outside the frontend.

## Local Development

The landing page implementation lives in `app/landing/_components` and is served at both `/` and `/landing`. Its WebGIS buttons navigate to `/map`, which implements the Figma Map Interaktif screen with dummy thematic data and a Leaflet/OpenStreetMap basemap over West Java. The Daerah panel loads West Java regencies and cities from the Geography API. It loads districts and villages on expansion, and search covers the branches loaded so far. Next.js calls FastAPI using the server-side `BEJIR_API_URL` environment variable, which defaults to `http://80.43.0.180:8000`. Set it in `apps/web/.env.local` to use a different server. The landing-page illustration remains a schematic, not geographic or flood data.

The interface uses Google Sans Flex through `next/font`, Tabler Icons, and a customized shadcn-style Button built with Radix Slot. Google font assets are fetched at build time. The map region panel requires access to the configured FastAPI server.

The four WebGIS routes are listed in `config/navigation.ts` and share `components/layout/webgis-header.tsx`. `/histori-banjir` implements Figma frame 289:65 with a yearly summary, shadcn charts, and a locally filterable/sortable/paginated shadcn table. Histori Banjir loads annual events and their impacts from the Flood API through Next.js. Summary year and region controls operate independently of table filters. Upstream responses are cached for five minutes. Unavailable location details, severity, and affected area display as —. Severity selections therefore return no matching records while the API lacks severity data. `/curah-hujan` implements Figma frame 201:955 with annual metric specimens, a shadcn bar chart, a display-only classification legend, and a filterable/sortable/paginated table. See [the rainfall notes](features/rainfall/README.md) for fixture and methodology boundaries. `/analisis` implements Figma frame 201:1285 with summary specimens, three shadcn charts, shared facility rows and a filterable/sortable/paginated regional susceptibility table. See [the analysis notes](features/webgis/ANALYSIS.md) for prototype and integration boundaries. The map overview and thematic controls still use demo fixtures.

All interface icons are named imports from `@tabler/icons-react`. Do not store SVG/PNG/ICO icon exports, icon sprite sheets, or downloaded icon files in the repository. Unused Figma exports and starter icons have been removed. Keep semantic feature components under `features/`; page-only landing UI belongs in `app/landing/_components`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load Google Sans Flex, following Bejir's design guidelines.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Shared UI System

Follow [DESIGN.md](../../DESIGN.md) and [the component usage guide](components/ui/README.md). UI primitives are local shadcn sources under `components/ui`; icons come from `@tabler/icons-react`. Charts compose shadcn Chart with Recharts. Tables use shadcn Table; interactive tables compose TanStack Table v8 with `components/shared/data-table.tsx`. No data services are connected by this setup.
