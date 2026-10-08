# Konkan Soil Insights

Build a clean, institutional, agriculture-focused web app called "Konkan Soil Intelligence." This is for government/research evaluators, not a consumer product — design should feel credible, precise, and calm, not flashy.
CORE PAGE: Soil Report View
- A full-width interactive map (use Leaflet or Mapbox) centered on the Konkan coast, Maharashtra (approx center: 17.3°N, 73.3°E, zoom level 9)
- User can tap/click anywhere on the map to select a point
- A crop selector dropdown (options: Mango, Cashew, Rice) above or beside the map
- On tap, show a loading state, then display a single soil report panel below or beside the map (not a card-grid layout — one clear, continuous panel):
  SOIL REPORT PANEL
  - Plain-language summary first: 3-4 short sentences (placeholder: "Soil pH is well suited for this crop.", "Organic matter is moderate.", "Soil holds water well but may drain slowly.")
  - Each sentence paired with a small color-coded status indicator (green/yellow/red)
  - Below the summary, a clearly labeled data section showing the collected values:
    - pH
    - Organic Carbon
    - Texture (classified, e.g. "Clay Loam")
    - Clay / Sand / Silt %
    - Bulk Density
  - Small source label at the bottom: "Soil survey data — modeled, static"
  - If applicable, a small note: "Estimated from nearby area"
  - If no data is available for the tapped point, show a calm empty state: "No soil data available for this location — try a nearby point"
DESIGN DIRECTION:
- Soft earthy/green color palette suited to agriculture — avoid bright consumer-app colors
- Generous white space, a single clean panel with subtle borders/shadow, not a card-grid layout
- Clear, legible sans-serif typography (good hierarchy: headers, labels, body text clearly differentiated)
- Minimal decoration, no icons needed in headers — keep it plain and data-forward, this is for officers and researchers, prioritize clarity
- Simple header/nav with a project name and a subtle tagline (e.g. "Soil suitability intelligence for Konkan agriculture")
DATA:
Use realistic placeholder/mock data for now — structure the data fetching as one async function (getSoilReport(lat, lon, crop)) that currently returns mock data but is clearly structured to be swapped for a real API call later.
LANGUAGE:
Build the UI text (labels, sentences) in a way that supports swapping to other languages later — centralize all user-facing strings rather than hardcoding them inline, even though only English is needed right now.
Do NOT add: user accounts, login, saved history, any backend/database integration, or any satellite/crop-health data — this is a soil-only, frontend-only, stateless demo at this stage.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aa9bea75-5695-4f61-9a48-fa77fb8bec83).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
