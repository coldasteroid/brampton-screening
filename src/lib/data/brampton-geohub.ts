// Brampton ArcGIS Open Data clients
// Discovered via ArcGIS Hub search: https://hub.arcgis.com/api/search/v1/...?q=Brampton

export const WARD_BOUNDARIES_URL =
  'https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Planning_Local_Government/FeatureServer/3/query?where=1%3D1&outFields=*&f=geojson';

export interface WardFeature {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown> & {
    WARD?: string | number;
    WARD_NO?: string | number;
    AREA_NAME?: string;
  };
}

export interface WardsGeoJSON {
  type: 'FeatureCollection';
  features: WardFeature[];
}

/**
 * Fetch Brampton ward boundaries. Cached at the edge via Cloudflare Cache API
 * (caller is a Worker — we get free edge caching for free).
 */
export async function getWardBoundaries(): Promise<WardsGeoJSON> {
  const res = await fetch(WARD_BOUNDARIES_URL, {
    cf: { cacheTtl: 60 * 60 * 24, cacheEverything: true } as any,
    headers: { accept: 'application/geo+json' },
  });
  if (!res.ok) throw new Error(`Brampton GeoHub fetch failed: ${res.status}`);
  return (await res.json()) as WardsGeoJSON;
}

/**
 * Static fallback shape for when the upstream is down — keeps the demo intact.
 * Just a single representative polygon centred on Brampton with one ward feature.
 */
export const FALLBACK_WARDS: WardsGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-79.85, 43.65],
            [-79.65, 43.65],
            [-79.65, 43.78],
            [-79.85, 43.78],
            [-79.85, 43.65],
          ],
        ],
      },
      properties: { WARD: 0, AREA_NAME: 'Brampton (fallback)' },
    },
  ],
};
