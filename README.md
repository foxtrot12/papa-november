# Papa November 🛠️

A lightweight, premium, and highly responsive web application built with **Svelte 5** and **TypeScript** to generate unique project names and codenames using dynamic datasets from public APIs.

---

## 🌟 Key Features

*   **Diverse API Feeds**: Fetch thematic naming data from:
    *   **Harry Potter API**: Magical spells, students, staff, and character list.
    *   **Star Trek API (STAPI)**: Spacecraft, characters, conflicts, and series.
    *   **PokéAPI**: Pokémon names, items, abilities, and moves.
    *   **Rick & Morty API**: Characters, locations, and episodes.
*   **Offline-First Resiliency**: Integrates a local, offline-ready fallback dictionary containing hundreds of curated adjectives and tech-themed nouns. If an external API is rate-limited or goes down, name generation seamlessly shifts to the local fallback with visual warning feedback.
*   **Dynamic Casing Formatting**: Formats project names on-the-fly into:
    *   `kebab-case` (`project-codename-here`)
    *   `snake_case` (`project_codename_here`)
    *   `camelCase` (`projectCodenameHere`)
    *   `PascalCase` (`ProjectCodenameHere`)
    *   `Space Separated` (`Project Codename Here`)
*   **Interactive Controls**:
    *   Set name length anywhere between **1 to 8 words**.
    *   Toggle word tokenization: Split full phrases into single words (e.g. `["Jean", "Luc", "Picard"]`) or keep full names/phrases intact as single entities.
*   **Persistent Favorites & History**:
    *   Star/favorite names to save them in a local vault.
    *   Review a recent history list of generated codenames.
    *   *Both lists automatically convert their casing dynamically whenever the global format changes.*
    *   Instant copy-to-clipboard by clicking on any generated, starred, or history item.
*   **API Performance Caching**: Caches fetched API results locally in memory for instant, zero-latency regeneration without redundant network requests.

---

## 📐 Architecture: The Adapter Pattern

To accommodate different API response shapes, the application utilizes the **Adapter Design Pattern**. 

A central TypeScript contract enforces a unified interface across all data sources, parsing various nested JSON objects, payloads, and structures into a clean array of strings:

```typescript
export interface Subcategory {
  id: string;
  name: string;
}

export interface ApiAdapter {
  id: string;
  name: string;
  subcategories: Subcategory[];
  fetchItems(subcategoryId: string): Promise<string[]>;
}
```

Adapters are registered inside a central directory:
*   [fallback.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/fallback.ts) - Offline adjective/noun list
*   [stapi.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/stapi.ts) - Star Trek POST parser
*   [pokeapi.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/pokeapi.ts) - PokéAPI paginated GET selector
*   [rickandmorty.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/rickandmorty.ts) - Rick & Morty REST mapping
*   [harrypotter.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/harrypotter.ts) - Harry Potter list compiler
*   [registry.ts](file:///mnt/penguinStorage/Projects/papa-november/src/lib/adapters/registry.ts) - Combines adapters and defaults to fallback registry.

---

## 🛠️ Technology Stack

*   **Svelte 5**: Utilizing new features like Runes (`$state`, `$derived`, `$effect`), standard event attributes (`onclick`), and state scoping (`untrack`).
*   **Vite 8**: Ultra-fast hot module replacement (HMR) and optimized rollup client bundling.
*   **TypeScript 6**: Strong typing, compilation checks, and type-safe adapter structures.
*   **Modern CSS**: HSL variables, dark mode styles (via `@media (prefers-color-scheme: dark)`), standard CSS nesting, sliders, custom scrollbars, loading shimmers, and responsive grids.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (version 18+) installed.

### Setup
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/foxtrot12/papa-november.git
   cd papa-november
   ```
2. Install the node packages:
   ```bash
   npm install
   ```

### Scripts

*   **Start Local Development Server**:
    ```bash
    npm run dev
    ```
*   **Production Client Compilation**:
    ```bash
    npm run build
    ```
*   **TypeScript & Svelte Code Validation Check**:
    ```bash
    npm run check
    ```
