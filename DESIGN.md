# Bejir Frontend Design Guidelines

This document defines the intended visual design for Bejir, the flood WebGIS for West Java. It guides frontend work in `apps/web` and covers presentation, components, and interaction. GIS methodology, rainfall thresholds, risk calculations, and backend contracts remain defined by the data and research requirements.

## 1. Frontend Stack

| Area | Choice |
| --- | --- |
| Framework | Next.js with TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Icons | Tabler Icons |
| Charts | shadcn/ui Chart components |
| Tables | shadcn/ui Table and Data Table patterns |
| Maps | Leaflet with OpenStreetMap, following project architecture |

Use shared components and semantic design tokens so the map, dashboard, tables, and detail panels follow the same visual rules. Use Tabler Icons consistently, including icons inside customized shadcn components.

This is a design specification, not a record of completed GIS functionality. The frontend uses Next.js, Tailwind, Google Sans Flex, Tabler Icons, and local shadcn primitives, including chart and table foundations. Feature-specific charts/tables and real GIS integration are added as their features are developed. Keep demo values in typed fixtures; this setup introduces no API or live data connections.

Write page and feature styles directly in JSX `className` using Tailwind utilities and variants, including responsive, interaction, scrollbar, and starting-state styles. Do not add feature-specific CSS files. Shared components under `apps/web/components/` retain their existing styling conventions. Keep Tailwind imports, theme tokens, global foundations, and shared component rules in the existing CSS files; Leaflet still requires its vendor stylesheet. Use React `style` only for values supplied dynamically, such as data-driven colors and chart configuration.

## 2. Source of Truth and Visual Direction

The visual source is [Bejir Design System, Figma node 315:375](https://www.figma.com/design/cKKKtUTxA7QyU4ko0HU1ru/BEJIR--Bencana-Banjir-?node-id=315-375), inspected on 20 October 2026. Use its foundation tokens and component variants across the landing page and WebGIS. GIS/data requirements in AGENTS.md remain authoritative for methodology and data meaning.

Use light Neutral surfaces, Blue primary actions, Indigo supporting series, compact controls, and clear Indonesian labels. Scope this setup to shared foundations and existing controls; the component inventory does not imply that every illustrated GIS feature is implemented.

## 3. Typography

Use **Google Sans Flex** throughout, including chart axes, tables, forms, and map controls. Load through the existing Next.js font setup with Arial/sans-serif fallback. Default variation settings: GRAD 0, ROND 0, wdth 100; regular 400, medium 500, semibold 600, bold 700 as needed.

| Tailwind token | Size / line height |
| --- | --- |
| text-xs | 12 / 16 px |
| text-sm | 14 / 20 px |
| text-base | 16 / 24 px |
| text-lg | 18 / 28 px |
| text-xl | 20 / 28 px |
| text-2xl | 24 / 32 px |
| text-3xl | 30 / 36 px |
| text-4xl | 36 / 40 px |
| text-5xl | 48 / 48 px |

Default body: text-sm; card title: text-base medium; page title: text-2xl semibold; metadata and compact control labels: text-xs. Keep units visible and align comparable numbers. Some legacy button samples specify Poppins and palette annotations reference Inter; these are source inconsistencies. The shared application font remains Google Sans Flex, matching the type specimens and the project requirement.

## 4. Interface Colors

The following values are taken from the Figma palette, including its Tailwind v4 shades. Use semantic CSS variables in `apps/web/app/globals.css` and shared shadcn components; do not introduce competing per-screen primary colors.

| Shade | Neutral | Blue | Indigo |
| --- | --- | --- | --- |
| 50 | #FAFAFA | #EFF6FF | #EEF2FF |
| 100 | #F5F5F5 | #DBEAFE | #E0E7FF |
| 200 | #E5E5E5 | #BEDBFF | #C6D2FF |
| 300 | #D4D4D4 | #8EC5FF | #A3B3FF |
| 400 | #A1A1A1 | #51A2FF | #7C86FF |
| 500 | #737373 | #2B7FFF | #615FFF |
| 600 | #525252 | #155DFC | #4F39F6 |
| 700 | #404040 | #1447E6 | #432DD7 |
| 800 | #262626 | #193CB8 | #372AAC |
| 900 | #171717 | #1C398E | #312C85 |
| 950 | #0A0A0A | #162456 | #1E1A4D |

Base colors: black #000000, white #FFFFFF, transparent. Shared bindings: white background/card/popover; Neutral 900 foreground; Neutral 100 muted; Neutral 500 muted text; Neutral 300 border/input; Blue 500 primary and ring; white primary text; Indigo 50 secondary surface with Indigo 700 text. Use Blue 600 for hover and Blue 700 for small links requiring stronger contrast. Verify small white text on Blue 500 for accessibility; use a darker interaction variant where needed.

Chart series use stable Blue/Indigo tokens; classification colors use their own semantic tokens. Dark mode is not specified or enabled by this setup.

## 5. Status Kerawanan and Curah Hujan Colors

Figma explicitly defines the susceptibility labels below (nodes 255:790 and 255:589). This supersedes the earlier unnamed palette order.

| Class | Label | Hex | Semantic token |
| --- | --- | --- | --- |
| Very low | Sangat Rendah | #3CFF00 | status-very-low |
| Low | Rendah | #E1FF00 | status-low |
| Medium | Sedang | #FFD000 | status-medium |
| High | Tinggi | #FF6A00 | status-high |
| Very high | Sangat Tinggi | #FF0000 | status-very-high |

Status tags: 8 px radius, 8 px horizontal / 4 px vertical padding, 12/16 px semibold text in #111111. Use labels as well as color, and retain exact base swatches even when map overlay opacity changes.

Rainfall shares this palette but has a **separate classification mapping**. Figma's reclassification sample is illustrative; its numerical bands are not an approved research method or backend contract. Display service-supplied thresholds, units, period, source, and methodology. Do not infer rainfall thresholds from colors, or calculate susceptibility classes inside UI components. Keep approved mappings consistent across maps, badges, charts, and tables.

## 6. Death and Missing Colors

| Meaning | Label | Hex |
| --- | --- | --- |
| Death | Meninggal | #FF0000 |
| Missing person | Hilang | #EFB100 |

These explicit project colors remain in force. Figma's casualty chart includes an illustrative yellow segment; it does not override the requested Hilang color. Missing people and unavailable data are distinct: display unavailable data in Neutral with an explained dash or `Tidak tersedia`. Never confuse potential impacts with confirmed casualties.

## 7. Spacing, Radius, and Effects

Figma spacing scale: **0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24 px**. These correspond to Tailwind `0`, `px`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `5`, `6`. Retain 16 px outer/card padding, 8 px related-control gaps, and 4 px tight metadata gaps as the normal defaults. Larger section spacing can use multiples of the scale.

Use Tailwind radius utilities: none, xs (2), sm (4), md (6), lg (8), xl (12), 2xl (16), 3xl (24), full. Figma's legacy labels contain duplicates; follow actual geometry and Tailwind v4 tokens. Controls may use the explicit 10 px medium-button radius. Shared shadcn `--radius` is 8 px with explicit derived radii to preserve those values.

Use flat surfaces throughout the frontend. Do not add decorative box shadows, inset shadows, text shadows, or drop shadows to components, sidebars, top bars, cards, charts, tooltips, or overlays. Use subtle borders or inset outlines for separation. Keyboard focus indicators remain visible. Blur samples are available from blur-none through blur-3xl; keep data, text, and controls sharp. Avoid decorative blur over map information.

## 8. Components and Icons

**All reusable interface controls come from shadcn/ui in `apps/web/components/ui`.** Compose those primitives into feature components; semantic HTML layout, map rendering, and decorative illustrations remain appropriate. Do not install the entire registry or invent alternative component kits. Add further primitives with `npx shadcn@latest add <component>` from `apps/web`, adapting styles to these tokens.

- Keep the configured new-york style, Neutral base, CSS variables, TypeScript/RSC aliases, and `iconLibrary: tabler` in `components.json`.
- Use `@tabler/icons-react` named imports for all interface icons, including icons in generated shadcn components. Do not store or use exported icon images, SVG/PNG/ICO icon files, sprite sheets, Lucide, or custom icon paths. Import named Tabler components directly where used rather than keeping a local icon registry. Decorative map imagery is separate from iconography.
- Standard icon: 24 px; compact: 16 px; stroke 2. Give icon-only actions accessible names and ensure adequate hit targets. Do not force all nested SVGs to one size.
- All button styles live in `components/ui/button.tsx`, using shadcn `Button` and `buttonVariants`. Fill (Figma `63:698`) uses Blue 500 with white text; Outline (`63:724`) uses a 1 px Blue 500 border and blue text on transparent background. Deactive (`63:711`) is the native `disabled` state at 25% opacity, preserving the selected variant. Use `size="sm"` for Small (32 px high, radius 8 px), the default size for Medium (40 px high, radius 10 px), and `size="lg"` for Large (48 px high, radius 12 px). Icon-only sizes `icon-sm`, `icon`, and `icon-lg` follow the same dimensions and radii. Labels share Google Sans Flex, 12 px / 16 px, semibold; icon-label gap is 8 px. Icons are 16 px for Small and 24 px for Medium/Large. Width follows content or container. Keep ghost controls for map tools and calendar days, whose specialized layouts may set their own geometry.
- Use shadcn Input, Textarea, Label, Checkbox, Select, Calendar/Popover, Tabs, Badge, Card, Sheet, Tooltip, Dropdown Menu, Pagination, and Skeleton as needed. Preserve keyboard/focus behavior from their underlying primitives. Disabled components must be semantically disabled.
- Header year filters use `components/ui/year-filter-button.tsx` (Figma `296:4971`) and `year-picker.tsx` (`296:4998`), composed from shadcn Button and DropdownMenu. The trigger follows this specimen: Blue 500, white 14/20 px regular text, a 24 px Tabler caret, 24 px gap, 16 px horizontal padding, 40 px height, and 16 px radius. This is a specific exception to the standard button geometry/type. The 115 px white year list has a Neutral 300 border, 16 px radius, 16/8 px padding and 8 px row gaps; selected years are Blue 500 and other years Neutral 400. Options come only from supplied data, ordered newest first, with keyboard selection and no shadows. All three report headers reuse this control and retain their existing year-change/reset behavior.

- Table filter triggers use the shared Button `filter` variant while no value is selected: white background, Neutral 300 border (the input border token), and Neutral 400 labels/icons, matching the search field. Selected filters use `outline`. Sorting starts inactive; all column headers cycle ascending, descending, then inactive, using Tabler IconSelector in Neutral 300 when inactive, IconSortAscending in Blue 500 when ascending, and IconSortDescending in Blue 500 when descending. Sorting is single-column and always begins ascending, including numeric columns.

- Calendar uses the shadcn Calendar/React DayPicker pattern, shared privately in `components/ui/calendar-base.tsx`. Use `CalendarTimeline` from `calendar-timeline.tsx` (Figma `306:8828`) for a single visible month with a centered caption; use `CalendarFilter` from `calendar-filter.tsx` (`364:1706`) for month/year dropdowns. Both support controlled single-date and range modes. Match 48 px day cells, 1 px grid gaps, 16 px padding, an 8 px outer radius, and 32 px blue navigation buttons. Calendar date labels follow the design's 14/20 px regular type, with 12/16 px neutral weekday labels; inherit Google Sans Flex and use Tabler chevrons without shadows. Shrink cells on narrow screens. Use actual valid dates rather than the specimen's illustrative weekday alignment. Timeline range drafts are committed with Apply, can be cleared, and remain local presentation filters without backend connections.
- Region filters use `components/ui/region-filter.tsx` (Figma `306:8767`). Render the supplied `RegionNode` hierarchy as Province, Regency/City, and District with independent checkbox selection and expandable branches. Pass `regions`, `value` (selected IDs), `onValueChange`, and optional `defaultExpandedIds`. Expanding/collapsing must preserve selection and must not fetch data. Reuse the existing region selection helper and type. Match the 497 px content width, 16 px padding/radius, Neutral 300 separators, 18/28 px semibold title, 16/24 px regular labels, 24 px Tabler chevrons/checkbox slots, and internal scrolling capped at 744 px or the viewport. The shared `RegionFilterPopover` is used by both the header and table on History, Rainfall, and Analysis pages. Both controls share `regionIds` state. Province selection matches all rows; selected regencies/cities or available districts combine with OR, while year and other filters still apply with AND. District options come only from supplied history rows; do not invent unavailable district data for rainfall or analysis.
- Category filters use `components/ui/category-filter.tsx` (Figma `306:7985`), with Keparahan, Klasifikasi, and Kerawanan headings. Match the white surface, Neutral 300 border, 16 px radius/padding, 18/28 px semibold title, divider, 10 px row gap, 24 px checkbox slots, and 16/24 px regular labels. Pass typed category options, selected values, and a change callback; reuse shadcn Checkbox/Label and preserve keyboard access. Fit the popover within narrow viewports. Use only categories supported by the caller’s existing presentation data.
- Overview/AI selection uses shadcn Tabs; feature state and callbacks stay outside generic UI primitives.
- Every data component needs loading, empty, error, unavailable, and selected states appropriate to its feature.

### Charts

Use shadcn `ChartContainer`, `ChartTooltipContent`, and `ChartLegendContent`, composed with **Recharts**, as documented by [shadcn Chart](https://ui.shadcn.com/docs/components/radix/chart). Recharts is the rendering dependency of shadcn charts, not a separate chart system. Use a typed `ChartConfig`, semantic series tokens, explicit height/min-height, accessibilityLayer, units, period, and readable labels. Include a textual summary or accessible table for essential values. Source chart families include timeline/area, rainfall/annual bars, regional horizontal bars, class distribution, and casualty donut. They are feature compositions, not reasons to add another library.

### Tables

Use shadcn Table primitives for every tabular view. Use the [shadcn Data Table pattern](https://ui.shadcn.com/docs/components/radix/data-table) with **TanStack Table** for sorting, filtering, selection, and pagination. TanStack supplies behavior and shadcn supplies presentation. Keep columns typed. For real datasets, integrate server pagination/filter/sort through a feature data-access layer rather than loading whole spatial datasets. Preserve numeric alignment, units, status labels, keyboard access, and contained horizontal scrolling.

### Figma component inventory

The source includes buttons, pagination, status tags/scales, overview cards/toggle, summaries, facility metrics, AI source/chat panels, page/year headers, category/region/month filters, calendars, map icon controls, and map sidebars. Build each from shared shadcn primitives as its feature is implemented. Do not present an illustrated capability or fixture as an available service.

## 9. Map and Dashboard Layout

On larger screens, keep the map central, with region and period filters, layer controls, a visible legend, and a detail or statistics panel. On smaller screens, stack dashboard content and use a shadcn Sheet for map filters or details when appropriate.

- Preserve access to zoom controls, legends, and OpenStreetMap attribution.
- Keep region and time filters consistent across maps, charts, tables, and statistics.
- Make selected layers and selected features clear without obscuring their data meaning.
- Show source, time period, and units in relevant detail views.
- Label mock data explicitly during frontend development.
- Keep map logic separate from general UI and API data access.
- Use geographic filtering, aggregation, or tiles for large layers rather than transferring millions of geometries to the browser.

## 10. Accessibility and Review

- Do not communicate meaning through color alone; pair it with labels, icons, or patterns.
- Check text, focus indicators, controls, and chart marks against their actual backgrounds.
- Verify readable text colors on all five bright classification colors and both impact colors.
- Support keyboard navigation, visible focus, and accessible names for interactive controls.
- Ensure dialogs and sheets manage focus and remain usable at narrow viewport widths.
- Verify responsive layouts, long region names, large values, and all data states.
- Confirm that identical classes and metrics retain identical colors across maps, charts, tables, and cards.
- Review palette bindings against approved dataset metadata before shipping classified views.

## 11. GIS Product Goal and Scope

Bejir brings flood event history, geographic conditions, rainfall, and flood susceptibility information for West Java into one interactive platform. The frontend should help users explore where events occurred, compare relevant geographic layers, understand regional statistics, and inspect analysis results to support flood monitoring and mitigation.

This scope follows the root `AGENTS.md` and `README.md`. It describes intended capabilities, not verified implementation or dataset availability. The README references `docs/PROJECT.md`, but that specification and `docs/requirements/` were absent when this alignment section was written. Detailed user roles, page routes, API contracts, and analysis workflows require project specifications as they become available.

| Capability | Frontend responsibility |
| --- | --- |
| Historical flood events | Present event locations, period and region filters, event details, and historical statistics |
| Rainfall | Present available rainfall layers, units, periods, sources, and approved classifications |
| Regional information | Support administrative-region selection and comparable regional statistics |
| Geographic and terrain information | Present elevation, slope, rivers, land cover, boundaries, buildings, population, and supporting road layers as available |
| Flood susceptibility | Display calculated susceptibility, approved class legends, methodology, and analysis period |
| Impact estimation | Present calculated potential population and building impacts, with the affected area and assumptions |
| Flood prediction | Present supported inputs and model results with an explicit prediction label and supplied uncertainty information |
| Inundation simulation | Present supported scenario inputs, simulated inundation extent, assumptions, and result details |
| Evacuation | Present retrieved evacuation locations and calculated routes, distances, and supplied route constraints |
| 3D visualization | Support geographic exploration once technology, data, and interaction requirements are agreed |
| Bejir AI assistant | Present grounded responses, supplied sources, and clear distinctions between information types |
| Administrative management | Present data-management workflows backed by server-enforced authorization |

Do not show a planned capability as available until its data and service integration are ready. Use clear unavailable states for unsupported datasets or operations.

## 12. GIS Workspace and Interaction

The proposed main workspace combines a map, layer controls, region and period filters, a legend, and a details/statistics area. A dashboard can provide broader comparisons using the same data context. Exact navigation and page routes remain to be defined.

### Shared context

- Coordinate region, time period, selected layers, and selected feature within the workspace.
- Apply region and period filters only where the dataset supports them. Explain when a layer is static or uses a different period.
- Label each statistic's scope: selected region, current viewport, or analysis area. Do not silently substitute one scope for another.
- Keep map, table, and chart selections consistent where they refer to the same records.
- When filters change, clear or revalidate selections and identify results that no longer match the current context.
- Show loading and error states per layer so one failed request does not hide other usable information.

### Layers and feature inspection

- Separate the basemap from thematic overlays; expose visibility and opacity controls where useful.
- Keep active-layer legends visible and associate each legend with its dataset and classification.
- Selecting a feature should expose relevant attributes, source, period, and available related information.
- Compare layers only with their geographic coverage, time coverage, units, and methodology made clear.
- Keep panels operable on mobile without blocking essential map controls or attribution.

### Suggested first frontend flow

Start with historical flood exploration: open the map, select a supported region and period, inspect an event, and view matching statistics or table records. This is an implementation starting point, not an agreed release priority. Use small labeled fixtures while the API contract is being prepared.

## 13. Data Meaning and Frontend Boundaries

Every result view must make its information type clear:

| Information type | Suggested visible label | Presentation rule |
| --- | --- | --- |
| Historical data | Data historis | Show recorded event or observation context |
| Calculated analysis | Hasil analisis | Show method and input-data context supplied by the service |
| Model prediction | Prediksi | Show the forecast period and supplied model limitations |
| Simulation result | Hasil simulasi | Show scenario inputs and assumptions |
| User-provided information | Informasi pengguna | Identify its origin and supplied verification status |

- Do not present potential impacts as confirmed casualties or recorded damage.
- Do not describe the nearest evacuation route as the safest route unless the service supports that conclusion.
- Do not fabricate locations, evacuation points, statistics, model confidence, or assistant citations.
- Keep rainfall normalization, classification thresholds, weights, susceptibility methods, routing calculations, and large spatial operations in the agreed backend/GIS workflow.
- Display source and CRS metadata when supplied. Respect the geometry contract and verify coordinate handling; metric distance and area calculations require an appropriate processing CRS.
- Keep database credentials, unrestricted database access, and LLM orchestration outside the browser. The assistant feature handles chat presentation and service communication.
- Frontend visibility controls may reflect permissions, but the server must authorize administrative actions.

## 14. Proposed Frontend Organization

Keep frontend implementation inside `apps/web` and retain its existing `app/` location. The following boundaries are a proposed organization aligned with the product scope; create modules as their features are implemented.

| Location under `apps/web` | Responsibility |
| --- | --- |
| `app/` | Routes, layouts, page composition, and route loading/error boundaries |
| `components/ui/` | Shared shadcn primitives, including chart and table building blocks |
| `components/layout/` and `components/shared/` | Shared navigation, application shell, and general feedback components |
| `features/webgis/` | Assemble domain features into the GIS workspace and coordinate shared filter/selection state |
| `app/landing/_components/` | Page-local landing UI; reused by `/` and `/landing` |
| `features/map/` | Browser-dependent Leaflet lifecycle, reusable layer rendering, controls, events, and cleanup |
| `features/regions/` | Region selection and regional information |
| `features/floods/` and `features/rainfall/` | Domain-specific components, data access, and types |
| `features/geography/` | Presentation of terrain and supporting geographic datasets |
| `features/susceptibility/` and `features/impact/` | Analysis-specific inputs and result presentation |
| `features/prediction/` and `features/inundation/` | Distinct prediction and simulation workflows |
| `features/evacuation/` | Evacuation-location and route presentation |
| `features/assistant/` and `features/admin/` | Chat interface and authorized data-management interface |
| `lib/api/` | Shared HTTP transport and predictable error handling |
| `config/` | Navigation and presentation configuration, including approved color bindings |
| `mocks/` | Small synthetic frontend fixtures with explicit mock-data labels |
| `public/` | Static interface assets |

Within a domain feature, start with `components/`, `api.ts`, and `types.ts` when needed; add hooks or further subdivisions only as complexity grows. Reuse existing types and utilities rather than duplicating them.

The WebGIS workspace composes domain features. The map module owns rendering mechanics; domain modules own their data requests and presentation meaning. Keep API calls out of unrelated UI primitives and isolate browser-dependent map code from server rendering.

Use filtered requests, pagination, aggregation, or tiles for large datasets. The documented spatial workload includes millions of buildings and hundreds of thousands of roads; these must not be bundled as frontend assets or loaded wholesale into the browser. Real dataset samples belong in the repository's `data/samples/` workflow, while GIS processing, spatial queries, and AI orchestration retain their existing monorepo responsibilities.

3D technology and workflows remain unresolved. Do not introduce a new visualization framework solely to populate a planned module.

The public landing page lives in `app/landing/_components`, is available at `/` and `/landing`, and introduces Bejir before visitors enter `/map`. The four WebGIS route folders are `app/map`, `app/histori-banjir`, `app/curah-hujan`, and `app/analisis`. Navigation uses real links from a shared configuration; the `/analisis` screen implements Figma frame 201:1285 with four summary specimens, frequency and susceptibility charts, a five-year events chart, affected facility specimens and a regional susceptibility table. This cross-domain presentation is composed under `features/webgis` using typed fixtures, shared facility rows and shadcn controls/charts/table. Year selection updates specimen panels; region, susceptibility and search filters apply only to the table. All analysis content is explicitly dummy: no GIS calculation, research method, prediction, backend API or real regional aggregate is implied. Preserve the approved five susceptibility colors and document the independent specimens and repeated prototype labels in `apps/web/features/webgis/ANALYSIS.md`. The `/curah-hujan` screen implements Figma frame 201:955 using annual metric specimens, a shadcn monthly bar chart, a five-color annual classification legend, and a monthly table with local region/month/classification/search filters, sorting and pagination. All rainfall content is explicitly dummy and supplied as typed presentation props without API connections. The legend preserves the design specimen and must not be used as a classification algorithm or research decision; annual legend ranges and monthly table specimens have separate contexts. See `apps/web/features/rainfall/README.md` for data semantics and integration boundaries. The `/histori-banjir` screen implements Figma frame 289:65 with an annual summary, casualty donut, monthly timeline, and a searchable, sortable, filterable shadcn table. All history content uses explicitly labeled synthetic fixtures supplied through typed presentation props; no backend API is connected. Table filters affect only table rows; the annual summary and timeline are independent design specimens. Calculate donut percentages and pagination from their displayed values rather than copying inconsistent decorative proportions or page counts. See `apps/web/features/floods/README.md` for integration boundaries. The `/map` screen implements Figma Map Interaktif node 274:702: a 64 px navbar and a full-width map with all panels initially closed. Four left toolbar buttons open Daerah, Layer, Legenda, or Waktu in a 264 px panel; the right toolbar opens the existing 456 px overview panel. Controls follow the frame geometry, with smaller targets and one panel at a time on narrow screens. All layer, legend, and date selections remain local demonstrations. Leaflet displays the OpenStreetMap basemap over West Java; external requests are limited to raster basemap tiles with visible attribution. Overview content and region choices remain typed dummy fixtures: they do not call backend APIs, request region geometries, filter real observations, or calculate GIS results. Keep this development status visible until integration is complete. Landing-page visuals may illustrate the interface concept, but must be explicitly labeled and must not imply real observations or analysis results.

## 15. GIS Alignment Review

Before completing a GIS frontend feature, verify that:

- Its behavior matches the available dataset and agreed API contract.
- Region, period, units, source, and result type are visible where relevant.
- Layer legends and all related charts, badges, and tables use the same approved mappings.
- Filter changes, feature selection, layer toggling, and map cleanup behave consistently.
- Loading, empty, unavailable, partial-failure, and error states are understandable.
- Large layers use an appropriate server-delivery strategy.
- Essential interactions work with keyboard navigation and narrow screens.
- Important flows and API integration behavior have appropriate verification.

Frontend implementation should follow this document while keeping research decisions and data classifications explicit and grounded in the supplied data.
