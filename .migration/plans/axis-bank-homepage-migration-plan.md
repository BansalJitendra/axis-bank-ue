# Axis Bank Homepage Migration Plan

Migrating the homepage from **https://www.axis.bank.in/** into this AEM Edge Delivery Services **Universal Editor (crosswalk)** project, including header navigation and footer.

## Project Context
- **Project type:** Universal Editor / crosswalk (`component-definition.json`, `component-models.json`, `component-filters.json` present; content authored to JCR)
- **AEM site path:** `/content/axis-bank` · **Assets:** `/content/dam/axis-bank`
- **Preview:** org `bansaljitendra`, site `axis-bank-ue`
- **Available blocks:** accordion, cards, carousel, columns, embed, footer, form, fragment, header, hero, modal, quote, search, table, tabs, video
- **Source URL:** `https://www.axis.bank.in/` (used exactly as provided — note: if this host fails to resolve during scraping, I'll pause and confirm the correct URL)

## Migration Approach
Orchestrated site-migration flow: scrape → analyze structure → decide authoring (default content vs. blocks) → map/create block variants → generate import infrastructure → import content → convert to JCR (xwalk) → verify. Header and footer handled via dedicated navigation and footer instrumentation.

## Checklist
- [ ] **Scrape source page** — fetch homepage HTML, extract metadata, download images, produce cleaned HTML
- [ ] **Identify page structure** — determine section boundaries and content sequences
- [ ] **Authoring analysis** — decide default content vs. blocks per sequence; validate block selection against available blocks
- [ ] **Block mapping / variants** — reuse existing blocks where possible (80% similarity); create new variants only when needed
- [ ] **Generate import infrastructure** — block parsers + page transformers + page template
- [ ] **Run content import** — generate/bundle import script, execute, produce content HTML
- [ ] **Migrate navigation (header)** — instrument desktop + mobile nav from the source header
- [ ] **Migrate footer** — instrument footer sections from the source footer
- [ ] **Convert to JCR/xwalk** — validate Universal Editor block models and field hinting; produce JCR XML
- [ ] **Preview & verify** — render locally, compare against original, fix rendering/styling issues
- [ ] **Visual critique & design match** — extract design tokens/styles, refine blocks to match original appearance

## Notes
- This project uses excat migration skills; content HTML will be produced only via the bundled import script (never hand-written).
- Execution requires **Execute mode** — approve this plan to begin, starting with scraping and structure analysis.
