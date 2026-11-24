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
└── public/                    # Non-icon static assets when needed
```

Empty folders contain `.gitkeep` placeholders so Git retains the structure. Remove a placeholder when adding real files to that folder. Add feature-local `components/`, hooks, `api.ts`, and `types.ts` only as needed; avoid empty implementation stubs.

The WebGIS workspace connects domain features. The map feature owns rendering mechanics, while each domain feature owns its data access and presentation meaning. Large datasets and spatial calculations remain outside the frontend.

## Local Development

For a fresh clone, use Node.js 24 and run from `apps/web`:

```powershell
npm ci
npm run dev
```

Browser API requests use `/backend/...` through the rewrites in `next.config.ts`. Aggregated web data uses `/backend/web/...`; documented API operations use `/backend/api/v1/...`. The default server-only API origin is `http://80.43.0.180:8000`; no `.env.local` is required
for that origin. Administrative metadata now comes directly from the lightweight
`/api/v1/geography/catalog` endpoint; no catalog backup is bundled. Do not remove the `catalog` prop from
`RegionSelectionProvider` or replace the catalog with empty arrays to bypass errors.
For a different API, copy `.env.example` to `.env.local`, set `BEJIR_API_URL`, and
ensure that server provides the catalog endpoint.

Prepared display boundaries and river data remain ignored by Git. Facility counts use the live impacts API; saved facility data and its legacy fallback have been removed. For the full
map/data features, prepare them with `npm run prepare:data` and
`npm run prepare:rivers`, or use the published prepared artifacts for the same
API origin. See [data preparation](../../docs/deployment/web-read-models.md).

The landing page implementation lives in `app/landing/_components` and is served at both `/` and `/landing`. Its WebGIS buttons navigate to `/map`, which implements the Figma Map Interaktif screen with live district thematic data and a Leaflet/OpenStreetMap basemap over West Java. The Daerah panel loads West Java regencies and cities from the Geography API. It loads districts and villages on expansion, and search covers all administrative levels using cached name metadata. Next.js calls FastAPI using the server-side `BEJIR_API_URL` environment variable, which defaults to `http://80.43.0.180:8000`. Set it in `apps/web/.env.local` to use a different server. The landing-page illustration remains a schematic, not geographic or flood data.

The interface uses Google Sans Flex through `next/font`, Tabler Icons, and a customized shadcn-style Button built with Radix Slot. Google font assets are fetched at build time. The map region panel requires access to the configured FastAPI server.

The four WebGIS routes share the existing layout and controls. `/histori-banjir` loads annual Flood events and impact records. Summary and table region filters share the active selection across WebGIS pages. Missing location details, severity and historical affected area display as —. `/curah-hujan` loads all 27 regency/city filter choices from Geography. Its table and region-filtered cards display the pixel-weighted rainfall parameter and extrema of district means, with available/total district coverage. Monthly/yearly observations and classification thresholds remain unavailable until the API provides period metadata and temporal observations.

`/analisis` retains regency/city rows. Population and raster coverage area are summed by district. Elevation uses the mean weighted by n_piksel. Regional susceptibility uses the pixel-weighted mode of district dominant classes, with tied modes unavailable. The approved labels 1–5 range from Sangat Rendah to Sangat Tinggi. Distribution counts districts. Spatial records have no assigned year. Flood summaries and historical facility-damage totals follow the selected year and regencies. Facility counts accumulate event records and may count repeated damage to the same facility. Public-facility taxonomy and river counts remain unavailable.

The map renders district rainfall, mean elevation, susceptibility and dominant land cover through the existing layer controls, with simplified validated boundaries. The overview aggregates selected district parameters and supported Flood scopes. The existing Titik Evakuasi checkbox controls the live site layer, and clicking the map requests a driving route. Region choices display administrative boundaries. The assistant calls the live chat endpoint. Shared parameter and statistics responses are cached for five minutes. Run `npm run prepare:data` before packaging to prepare the shared administrative catalog, display geometry and the legacy-backend facility projection. Successful preparation covers 27 regencies/cities, 627 districts and 2,245 unique flood events. Deploy the new lightweight metadata and SQL facility endpoints to activate them on FastAPI. See [preparation/deployment](../../docs/deployment/web-read-models.md) and [web API integration notes](../../docs/api/web-integration.md) for methods, CRS, contracts and remaining data gaps.

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

The river API is connected to the existing map layer, Overview and Analysis. Run `npm run prepare:rivers` before packaging and after river imports; see [river data preparation](../../docs/deployment/river-layer.md).
