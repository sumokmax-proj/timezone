# Timezone App — CLAUDE.md

## Project Overview
A mobile-first web app displaying real-time clocks for 3 cities:
- **Hanoi, Vietnam** (UTC+7)
- **San Diego, California, USA** (UTC-8 / UTC-7 DST)
- **Seoul, South Korea** (UTC+9)

## Core Requirements
1. Show live current time for all 3 cities, updated every second
2. Language: English only
3. Mobile web only (target: 375–430px wide screens)
4. Drag-and-drop reordering of 3 clock cards (top position = default by GPS)
5. GPS auto-detection: user's current country clock goes to top slot on first load
6. Sleek, modern design — city name and time must be immediately readable at a glance

## Tech Stack
- **Vanilla HTML + CSS + JavaScript** (no framework, no build tool)
- Single `index.html` file (self-contained)
- No external dependencies except Google Fonts (loaded via CDN)
- Geolocation API for GPS-based default ordering
- Native JS `Intl.DateTimeFormat` for timezone-accurate time display
- HTML5 Drag-and-Drop API for card reordering
- `localStorage` to persist user's preferred card order

## File Structure
```
/home/ubuntu/timezone/
├── CLAUDE.md
└── index.html       ← single deliverable file
```

## Design System
- **Color palette**: Dark background (#0D0D0F), card dark glass (#1A1A2E), accent gradient (purple → cyan)
- **Font**: Inter (Google Fonts)
- **Card layout**: Full-width cards stacked vertically, generous padding
- **Typography hierarchy**:
  - City name: 16px, muted label
  - Country: 12px, accent color tag
  - Time: 56px bold, primary white
  - Date: 14px, muted gray
- **Visual cues**: Daytime (☀️ warm tint) vs Nighttime (🌙 cool tint) per city
- **Drag handle**: subtle grip icon on card, drag state with scale + shadow

## Behavior Details
- Clocks update every 1000ms via `setInterval`
- On load: request Geolocation → match country → reorder cards accordingly
- If GPS denied/unavailable: default order is Seoul → Hanoi → San Diego
- Card order saved to `localStorage` key: `tz-order`
- Drag-and-drop: touch events supported (for mobile)

## Constraints
- No backend, no build process — pure static file
- Must work offline after first load (no critical external API calls)
- DST handled automatically by `Intl.DateTimeFormat` with IANA timezone strings
