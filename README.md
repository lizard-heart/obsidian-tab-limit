# Tab Limiter

Tab Limiter is an Obsidian plugin that keeps the number of open Markdown tabs under a configurable limit.

When opening a new Markdown tab would exceed the limit, the plugin closes the least recently used Markdown tab instead of blocking the new tab. Switching to a tab marks it as recently used, so older inactive tabs are replaced first.

## Settings

Use the plugin settings tab to choose the global maximum number of Markdown tabs. The default limit is 5.

## Development

Install dependencies and build the plugin:

```bash
npm ci
npm run build
```

The build outputs `main.js`, which can be installed with `manifest.json` in an Obsidian vault plugin directory.
