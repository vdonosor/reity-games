# Reity RPG – React + Vite + Tailwind

This is a clean React (JavaScript) + Vite setup using Tailwind CSS (latest). It includes a token-based color system wired to Tailwind utilities and light/dark support via CSS variables.

## Scripts

- dev: Start the dev server
- build: Production build
- preview: Preview the production build locally

## Tailwind color system

Theme tokens are defined in `src/styles/theme.css` as CSS variables using OKLCH components. The `tailwind.config.js` maps Tailwind color utilities to those variables.

- Semantic: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `text-muted-foreground`, `border-border`.
- Brand scales: `bg-primary-500`, `bg-secondary-600`, `bg-accent-400`, etc.

Dark mode is driven by `prefers-color-scheme: dark` in `theme.css`. You can swap to a class strategy later if desired.

## Where things live

- `src/styles/theme.css`: Color tokens and dark overrides
- `src/global.css`: Imports theme first, then Tailwind
- `tailwind.config.js`: Maps tokens to utilities and sets the content globs
- `src/App.jsx`: Example usage of semantic and brand utilities

## Try it

```bash
npm install
npm run dev
```

## Customize the palette

Update the CSS variables in `theme.css` (both light and dark). For example, to change the primary brand hue, adjust the `--primary-*` values. Utilities like `bg-primary-600` will reflect your changes automatically.
