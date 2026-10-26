"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
// maplibre-gl v6 is ESM-only with named exports and has no default export. `Map` is
// imported under their `MapLibreMap` alias so it cannot shadow the global `Map`
// used for the marker registry below.
import {
  LngLatBounds,
  MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import { Maximize2 } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Destination, LatLng, TravelLeg } from "@/lib/types";
import { MapPinPreview } from "./MapPinPreview";

/**
 * Basemap is OpenFreeMap: free, keyless, no signup, no usage limits, serving
 * OpenMapTiles-schema vector tiles. (Mapbox, Google, CARTO and Stadia all
 * require an API key.) Because the basemap renders to a canvas and our pins are
 * DOM markers, the warm editorial tint is a CSS filter on the canvas alone and
 * never touches pin or route colour. See `.maplibregl-canvas` in globals.css.
 *
 * `NEXT_PUBLIC_MAP_STYLE_URL` overrides the style; OpenFreeMap also publishes
 * `bright` and `positron`, or point it at a self-hosted style JSON.
 */
const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/liberty";

/**
 * Once bundled, MapLibre's own worker-URL resolver bails out (it only trusts an
 * `http(s):` `import.meta.url`) and ends up calling `new Worker("")`. The worker
 * is copied into `public/` on predev/prebuild by scripts/copy-map-worker.mjs,
 * so point MapLibre at it before any map is constructed.
 */
setWorkerUrl("/maplibre-gl-worker.mjs");

const CLAY = "#8c3b3b";
const CLAY_DARK = "#5f2423";
const ROUTE_SOURCE = "dr-route";
const ROUTE_LAYER = "dr-route-line";

const FIT_OPTIONS = { padding: 56, maxZoom: 16, duration: 0 } as const;

const SVG_NS = "http://www.w3.org/2000/svg";
const PIN_PATH =
  "M15 39C15 39 28.5 23 28.5 14.5C28.5 6.8 22.4 1 15 1C7.6 1 1.5 6.8 1.5 14.5C1.5 23 15 39 15 39Z";

/**
 * Built with DOM APIs rather than an HTML string: the stop number is the only
 * dynamic part and it goes in via `textContent`, so no amount of later editing
 * can smuggle venue-supplied text into markup.
 */
function createPin(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 30 40");
  svg.setAttribute("aria-hidden", "true");
  svg.style.display = "block";
  svg.style.filter = "drop-shadow(0 2px 4px rgba(46,38,34,.35))";

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", PIN_PATH);
  path.setAttribute("stroke", "#fffdfa");
  path.setAttribute("stroke-width", "2");

  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", "15");
  text.setAttribute("y", "19.5");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-family", "system-ui,sans-serif");
  text.setAttribute("font-size", "13");
  text.setAttribute("font-weight", "600");
  text.setAttribute("fill", "#fffdfa");

  svg.append(path, text);
  return svg;
}

function paintPin(svg: SVGSVGElement, order: number, active: boolean): void {
  const scale = active ? 1.25 : 1;
  svg.setAttribute("width", String(Math.round(30 * scale)));
  svg.setAttribute("height", String(Math.round(40 * scale)));
  svg.querySelector("path")?.setAttribute("fill", active ? CLAY_DARK : CLAY);
  const text = svg.querySelector("text");
  if (text) text.textContent = String(order);
}

function boundsOf(points: LatLng[]): LngLatBounds {
  return points.reduce(
    (bounds, p) => bounds.extend([p.lng, p.lat]),
    new LngLatBounds(),
  );
}

function routeFeature(line: LatLng[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: line.map((p) => [p.lng, p.lat] as [number, number]),
    },
  };
}

export type InteractiveMapProps = {
  destinations: Destination[];
  legs: TravelLeg[];
  /** Road-following polyline when a router answered; straight lines otherwise. */
  geometry: LatLng[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
  /**
   * Set once the map pane is revealed from behind a `display:none` tab, so
   * MapLibre can re-measure. Always false on desktop, where the pane is visible
   * from mount and needs no re-measure.
   */
  revealed?: boolean;
};

export default function InteractiveMap({
  destinations,
  legs,
  geometry,
  selectedId,
  onSelect,
  onViewDetails,
  revealed = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  // Popup content stays a React component; MapLibre only owns the positioning.
  const [popupHost] = useState(() =>
    typeof document === "undefined" ? null : document.createElement("div"),
  );
  const popupRef = useRef<Popup | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const labelsRef = useRef<Marker[]>([]);
  const lastFocusedId = useRef(selectedId);

  const points = destinations.map((d) => ({ lat: d.latitude, lng: d.longitude }));
  const token = destinations.map((d) => d.id).join("|");
  const line = geometry ?? points;
  const selected = destinations.find((d) => d.id === selectedId);

  // Latest callbacks, so the imperative marker click handlers below never close
  // over stale props. Written in an effect, never during render.
  const handlers = useRef({ onSelect, onViewDetails });
  useEffect(() => {
    handlers.current = { onSelect, onViewDetails };
  });

  // --- map lifecycle -------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Captured up front: these ref objects never change identity, so holding
    // them locally keeps the cleanup honest about what it tears down.
    const markers = markersRef.current;
    const labels = labelsRef.current;

    const instance = new MapLibreMap({
      container,
      style: MAP_STYLE_URL,
      center: [110.3695, -7.7975], // Yogyakarta, replaced by fitBounds on load
      zoom: 12,
      attributionControl: { compact: true },
    });

    instance.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    instance.on("load", () => {
      instance.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: routeFeature([]),
      });
      instance.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": CLAY, "line-width": 4, "line-opacity": 0.85 },
      });
      setMap(instance);
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      markers.forEach((m) => m.remove());
      markers.clear();
      labels.forEach((m) => m.remove());
      labels.length = 0;
      setMap(null);
      instance.remove();
    };
  }, []);

  // --- route line ----------------------------------------------------------
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    source?.setData(routeFeature(line.length > 1 ? line : []));
    // Dashed while we are only drawing straight lines between stops, so the map
    // never implies a road that was not actually routed. [1, 0] reads as solid.
    map.setPaintProperty(
      ROUTE_LAYER,
      "line-dasharray",
      geometry ? [1, 0] : [1.5, 1.75],
    );
    // `line` is rebuilt every render; the route only changes with these two.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geometry, token]);

  // --- destination pins ----------------------------------------------------
  useEffect(() => {
    if (!map) return;
    const markers = markersRef.current;

    markers.forEach((marker) => marker.remove());
    markers.clear();

    destinations.forEach((destination, index) => {
      const element = document.createElement("button");
      element.type = "button";
      element.title = `Stop ${index + 1}: ${destination.name}`;
      element.setAttribute("aria-label", element.title);
      element.style.cursor = "pointer";
      element.style.background = "none";
      element.style.border = "none";
      element.style.padding = "0";
      const svg = createPin();
      paintPin(svg, index + 1, destination.id === selectedId);
      element.append(svg);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        handlers.current.onSelect(destination.id);
      });

      markers.set(
        destination.id,
        new Marker({ element, anchor: "bottom" })
          .setLngLat([destination.longitude, destination.latitude])
          .addTo(map),
      );
    });

    // Rebuilt only when the set/order of stops changes; the active-pin styling
    // is applied separately so selecting never re-creates every marker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);

  // --- active pin styling --------------------------------------------------
  useEffect(() => {
    destinations.forEach((destination, index) => {
      const element = markersRef.current.get(destination.id)?.getElement();
      const svg = element?.querySelector("svg");
      if (!element || !svg) return;
      paintPin(svg, index + 1, destination.id === selectedId);
      element.style.zIndex = destination.id === selectedId ? "2" : "1";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token, selectedId]);

  // --- travel-time labels between stops ------------------------------------
  useEffect(() => {
    if (!map) return;
    // Mutated in place, never reassigned, so the array identity stays stable for
    // the lifecycle effect's cleanup.
    const labels = labelsRef.current;
    labels.forEach((marker) => marker.remove());
    labels.length = 0;

    legs.forEach((leg, index) => {
      const from = points[index];
      const to = points[index + 1];
      if (!from || !to) return;

      // `~` rather than "est.", the same mark the summary already uses for a
      // travel figure that is a guess. The pill is too small for a word.
      const text =
        leg.minutes === null
          ? "no time"
          : `${leg.source === "estimated" ? "~ " : ""}${formatDuration(leg.minutes)}`;

      const element = document.createElement("span");
      element.textContent = text;
      element.style.cssText =
        "white-space:nowrap;background:#fffdfa;border:1px solid #ddcdbd;color:#2e2622;" +
        "border-radius:999px;padding:2px 8px;font:500 11px/1.4 system-ui,sans-serif;" +
        "box-shadow:0 1px 3px rgba(46,38,34,.18);pointer-events:none";

      labels.push(
        new Marker({ element, anchor: "center" })
          .setLngLat([(from.lng + to.lng) / 2, (from.lat + to.lat) / 2])
          .addTo(map),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, legs]);

  // --- fit the whole itinerary ---------------------------------------------
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 15 });
      return;
    }
    map.fitBounds(boundsOf(points), FIT_OPTIONS);
    // Framing follows the stop list, not every render, so panning by hand is
    // never undone by an unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);

  // --- focus the active stop and show its preview ---------------------------
  useEffect(() => {
    if (!map || !popupHost || !selected) return;
    if (lastFocusedId.current === selected.id) return;
    lastFocusedId.current = selected.id;

    const popup =
      popupRef.current ??
      (popupRef.current = new Popup({
        closeButton: false,
        closeOnClick: true,
        offset: [0, -46],
        className: "dr-popup",
        maxWidth: "none",
      }).setDOMContent(popupHost));

    map.easeTo({
      center: [selected.longitude, selected.latitude],
      duration: 600,
    });
    popup.setLngLat([selected.longitude, selected.latitude]).addTo(map);
  }, [map, popupHost, selected]);

  // Drop the preview when its stop leaves the plan.
  useEffect(() => {
    if (selected === undefined) popupRef.current?.remove();
  }, [selected]);

  // --- re-measure after being revealed from a hidden tab --------------------
  useEffect(() => {
    if (!map || !revealed) return;
    map.resize();
    if (points.length > 1) map.fitBounds(boundsOf(points), FIT_OPTIONS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, revealed]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Map of the plan"
      />

      {destinations.length === 0 ? (
        <div className="bg-clay-soft/50 text-ink-muted absolute inset-0 flex items-center justify-center p-6 text-center text-sm">
          Add a stop and it will show up here.
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!map || points.length < 2) return;
          map.fitBounds(boundsOf(points), { ...FIT_OPTIONS, duration: 600 });
        }}
        aria-label="Fit all stops in view"
        className="border-line-strong bg-paper text-ink hover:bg-clay-soft absolute right-2.5 bottom-24 z-10 flex size-9 items-center justify-center rounded-lg border shadow-sm transition-colors"
      >
        <Maximize2 size={15} aria-hidden />
      </button>

      {popupHost && selected
        ? createPortal(
            <MapPinPreview
              destination={selected}
              onViewDetails={() => handlers.current.onViewDetails(selected.id)}
            />,
            popupHost,
          )
        : null}
    </div>
  );
}
