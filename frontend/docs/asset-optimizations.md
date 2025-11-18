# Asset & Network Optimizations

This project includes several optimizations to ensure fast load times and efficient network usage.

## Compression
We use `vite-plugin-compression` to automatically generate compressed versions of static assets during the build process.
- **Gzip**: Standard compression supported by all browsers (`.gz` files).
- **Brotli**: Superior compression supported by modern browsers (`.br` files).

The server should be configured to serve these pre-compressed files when the `Accept-Encoding` header matches.

## Bundle Analysis
To visualize the size of the output bundle and identify large dependencies:

```bash
npm run analyze
```

This command runs a production build and opens a visual report (`dist/stats.html`) in your default browser.

## Caching Strategy
- **Vendor Chunking**: Core libraries like React, Axios, and Tailwind are split into separate chunks (`manualChunks` in `vite.config.ts`). This allows browsers to cache them independently of your application code.
- **Hash Filenames**: Vite automatically adds content hashes to filenames (e.g., `index.a1b2c3d4.js`), ensuring that users always get the latest version when code changes, while caching unchanged files indefinitely.

## PWA
The app is configured as a Progressive Web App (PWA) using `vite-plugin-pwa`, allowing it to be installed and work offline.
