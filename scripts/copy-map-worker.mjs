import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy MapLibre's web worker into `public/`.
 *
 * When maplibre-gl is bundled, its internal worker-URL resolver reads
 * `import.meta.url`, finds it is not an `http(s):` URL, and gives up, leaving
 * `new Worker("")` and a "Worker failed to load" error. Serving the worker as a
 * static asset and pointing `setWorkerUrl` at it is the fix.
 *
 * Copied on predev/prebuild rather than committed, so the worker can never drift
 * out of sync with the installed maplibre-gl version.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const target = join(root, "public/maplibre-gl-worker.mjs");

mkdirSync(join(root, "public"), { recursive: true });
copyFileSync(source, target);
console.log("Copied maplibre-gl worker to public/maplibre-gl-worker.mjs");
