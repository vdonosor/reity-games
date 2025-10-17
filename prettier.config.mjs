// Prettier config for React 19 + Vite + Tailwind
// Uses Prettier v3 flat config export style.

/** @type {import('prettier').Config} */
const config = {
  printWidth: 88,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  singleAttributePerLine: false,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['clsx', 'cva', 'tw'],
};

export default config;
