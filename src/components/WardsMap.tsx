'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Layer } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface WardSummary {
  ward: number;
  n: number;
  total_cents: number;
}

interface Props {
  byWard: WardSummary[];
}

const BRAMPTON_CENTER: [number, number] = [43.7315, -79.7624];

export default function WardsMap({ byWard }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!ref.current || mapRef.current) return;
      const L = (await import('leaflet')).default;

      const map = L.map(ref.current, {
        center: BRAMPTON_CENTER,
        zoom: 11,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
      }).addTo(map);

      try {
        const res = await fetch('/api/geo/wards');
        const geo = (await res.json()) as GeoJSON.GeoJsonObject;
        if (cancelled) return;
        const maxN = Math.max(1, ...byWard.map((b) => b.n));
        const byWardMap = new Map(byWard.map((b) => [b.ward, b]));

        const layer = L.geoJSON(geo, {
          style: (f: any) => {
            const wardNum = readWard(f);
            const summary = wardNum != null ? byWardMap.get(wardNum) : undefined;
            const intensity = summary ? summary.n / maxN : 0;
            return {
              color: '#0B1F3A',
              weight: 1,
              fillColor: intensityColor(intensity),
              fillOpacity: 0.55,
            };
          },
          onEachFeature: (f: any, lyr: Layer) => {
            const wardNum = readWard(f);
            const summary = wardNum != null ? byWardMap.get(wardNum) : undefined;
            const name = f.properties?.AREA_NAME ?? f.properties?.NAME ?? `Ward ${wardNum ?? '?'}`;
            const html = summary
              ? `<div style="font:600 13px Inter, sans-serif;color:#0B1F3A">${escape(name)}</div>
                 <div style="font-size:12px;color:#475569;margin-top:2px">${summary.n} active notices · $${(
                   summary.total_cents / 100
                 ).toLocaleString('en-CA')}</div>`
              : `<div style="font:600 13px Inter, sans-serif;color:#0B1F3A">${escape(name)}</div>
                 <div style="font-size:12px;color:#475569;margin-top:2px">No active notices</div>`;
            lyr.bindTooltip(html, { sticky: true, opacity: 0.95 });
            lyr.on('click', () => setSelected(wardNum ?? null));
          },
        }).addTo(map);

        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      } catch (e) {
        console.warn('Wards failed to load', e);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [byWard]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-card">
      <div ref={ref} className="h-[480px] w-full" aria-label="Map of Brampton wards showing active notice density" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-surface-raised/90 px-4 py-3 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Brampton wards</p>
        <p className="mt-1 font-display text-sm font-semibold">
          {selected != null ? `Ward ${selected}` : 'Active notice density'}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {[0.1, 0.3, 0.55, 0.8, 1].map((i) => (
            <span key={i} className="h-1.5 w-5 rounded-sm" style={{ background: intensityColor(i) }} />
          ))}
          <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-subtle">low → high</span>
        </div>
      </div>
    </div>
  );
}

function readWard(f: any): number | null {
  const raw = f?.properties?.WARD_NO ?? f?.properties?.WARD ?? f?.properties?.WARDNUM ?? null;
  if (raw == null) return null;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function intensityColor(i: number): string {
  if (i < 0.2) return '#E2EEF8';
  if (i < 0.4) return '#B4D2EE';
  if (i < 0.6) return '#7FB3E0';
  if (i < 0.8) return '#3D85C7';
  return '#003F87';
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
