/**
 * The map background shared by the home page map and the Worldwide map.
 *
 * Both draw OpenStreetMap's roads, parks and place names in one of CARTO's
 * styles, served from CARTO's free tile service. We do not use
 * tile.openstreetmap.org itself: that service is donated, and the people who
 * run it ask that software handed out to other people does not point at it.
 * This hub is meant to be installed by any cafe that wants it, so every copy
 * would be doing exactly that.
 *
 * CARTO asks every site to use its own key. Tiles fetched without one still
 * arrive, but with an "API key required" watermark. Each cafe pastes its own
 * key under Settings, Maps. It travels in the public cafe profile,
 * because the visitor's browser is what fetches the tiles.
 */

/** The CARTO styles the site uses. */
export type CartoStyle = 'light_all' | 'dark_all' | 'rastertiles/voyager';

/** The letters Leaflet swaps into {s}, spreading tile requests over CARTO's hosts. */
export const CARTO_SUBDOMAINS = 'abcd';

/**
 * The Leaflet tile address for a CARTO style, with the cafe's key on the end
 * when there is one. Leaflet fills in {s}, {z}, {x}, {y} and {r} for each
 * tile. The key is encoded, so it can never be mistaken for one of them.
 */
export function cartoTileUrl(style: CartoStyle, apiKey: string | null | undefined): string {
  const base = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  const key = (apiKey ?? '').trim();
  return key ? `${base}?key=${encodeURIComponent(key)}` : base;
}

// ── The free default: OpenFreeMap ────────────────────────────────────────────
//
// Without a CARTO key every CARTO tile is the "API key required" watermark, so
// a hub with no key now draws OpenFreeMap instead (https://openfreemap.org):
// OpenStreetMap data with no key, no sign-up and no request limits, run as a
// public service. Its tiles are vector tiles, which Leaflet cannot draw by
// itself, so MapLibre GL draws them inside a Leaflet layer
// (@maplibre/maplibre-gl-leaflet). Both are loaded only when a map is shown.
//
// A cafe that pastes a CARTO key under Settings, Maps still gets CARTO.

/** OpenFreeMap's dark style, the closest match to CARTO's dark_all. */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

/**
 * The credit each source asks for. Plain text rather than links: the maps are
 * hidden from screen readers and keep keyboard focus out, so nothing inside
 * them should be focusable.
 */
export const OPENFREEMAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap';
export const CARTO_ATTRIBUTION = '© OpenStreetMap contributors © CARTO';

export type BaseLayerKind = 'carto' | 'openfreemap';

/** Which source a map should use for this key. */
export function baseLayerKind(apiKey: string | null | undefined): BaseLayerKind {
  return (apiKey ?? '').trim() ? 'carto' : 'openfreemap';
}

/**
 * A Leaflet layer for the map's background: CARTO when the cafe has a key,
 * OpenFreeMap when it does not. `L` is the Leaflet module the map was made
 * with. Throws if the browser cannot draw it (OpenFreeMap needs WebGL), so
 * the caller can fall back to the list on its own.
 */
export async function createBaseLayer(L: any, apiKey: string | null | undefined, cartoStyle: CartoStyle): Promise<any> {
  if (baseLayerKind(apiKey) === 'carto') {
    return L.tileLayer(cartoTileUrl(cartoStyle, apiKey), {
      subdomains: CARTO_SUBDOMAINS,
      maxZoom: 19,
      attribution: CARTO_ATTRIBUTION,
    });
  }
  await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
  // The plugin adds L.maplibreGL to the same Leaflet module the map uses.
  await import('@maplibre/maplibre-gl-leaflet');
  if (typeof L.maplibreGL !== 'function') throw new Error('The vector map layer did not load');
  return L.maplibreGL({
    style: OPENFREEMAP_STYLE,
    attribution: OPENFREEMAP_ATTRIBUTION,
  });
}

/** The background layer a map has now, so a new key can swap it. */
export interface BaseLayerState {
  layer: any;
  kind: BaseLayerKind | null;
  /** The swap in progress, so two never run at once and add two layers. */
  queue?: Promise<void>;
}

/**
 * Put the right background on `map` for this key. The key can arrive after
 * the map is drawn or change while the page is open: a new CARTO key only
 * changes the tile address, while gaining or losing a key swaps the source.
 */
export async function syncBaseLayer(
  L: any,
  map: any,
  state: BaseLayerState,
  apiKey: string | null | undefined,
  cartoStyle: CartoStyle,
): Promise<void> {
  const apply = async () => {
    const kind = baseLayerKind(apiKey);
    if (state.layer && state.kind === kind) {
      if (kind === 'carto') state.layer.setUrl(cartoTileUrl(cartoStyle, apiKey));
      return;
    }
    const next = await createBaseLayer(L, apiKey, cartoStyle);
    if (state.layer) map.removeLayer(state.layer);
    state.layer = next.addTo(map);
    state.kind = kind;
  };
  // A map with no background still shows its pins, and the list beside it
  // still tells the whole story, so a failure here is not passed on.
  state.queue = (state.queue ?? Promise.resolve()).then(apply).catch(() => {});
  return state.queue;
}
