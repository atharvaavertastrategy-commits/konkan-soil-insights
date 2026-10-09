import { createFileRoute, ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { copy, crops, type Crop } from '@/lib/soil-copy';
import { getSoilReport, initialPoint, initialReport, type Point, type SoilReport, type Status } from '@/lib/soil-report';

const SoilMap = lazy(() => import('@/components/soil-map'));
export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: copy.titleMeta }, { name: 'description', content: copy.descriptionMeta },
    { property: 'og:title', content: copy.titleMeta }, { property: 'og:description', content: copy.descriptionMeta },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const statusClass: Record<Status, string> = { good: 'bg-status-good', warning: 'bg-status-warning', poor: 'bg-status-poor' };
const statusLabel: Record<Status, string> = { good: copy.favorable, warning: copy.attention, poor: copy.unsuitable };

type Depth = 'surface' | 'subsoil';
function layerAt(report: SoilReport, depth: Depth) {
  return depth === 'subsoil' && report.subsoil ? report.subsoil : report.surface;
}

function Index() {
  const [crop, setCrop] = useState<Crop>('Mango');
  const [point, setPoint] = useState<Point>(initialPoint);
  const [report, setReport] = useState<SoilReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [depth, setDepth] = useState<'surface' | 'subsoil'>('surface');
  const request = useRef(0);
  async function assess(nextPoint: Point, nextCrop: Crop) {
    const id = ++request.current;
    setPoint(nextPoint); setCrop(nextCrop); setDepth('surface'); setLoading(true); setError(false);
    try {
      const result = await getSoilReport(nextPoint.lat, nextPoint.lon, nextCrop);
      if (id === request.current) setReport(result);
    } catch { if (id === request.current) setError(true); }
    finally { if (id === request.current) setLoading(false); }
  }
  const mapFallback = <div className="map-shell grid place-items-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">{copy.mapLoading}</div>;

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card">
      <div className="page-width flex flex-wrap items-center justify-between gap-4 py-6">
        <div><p className="brand-name text-xl font-semibold text-primary">{copy.name}</p><p className="mt-1 text-xs text-muted-foreground">{copy.tagline}</p></div>
        <div className="hidden items-center gap-7 text-xs md:flex"><span className="text-muted-foreground">{copy.region}</span><span className="border-l border-border pl-7 font-medium text-primary">{copy.view}</span></div>
      </div>
    </header>
    <main>
      <div className="page-width flex flex-wrap items-end justify-between gap-6 pb-7 pt-9">
        <div><p className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">{copy.eyebrow}</p><h1 className="text-[32px] leading-tight font-medium">{copy.title}</h1><p className="mt-3 text-sm text-muted-foreground">{copy.subtitle}</p></div>
        <div className="flex flex-wrap items-end gap-5"><span className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-status-warning" />{copy.demo}</span><div className="w-44"><label id="crop-label" className="mb-2 block text-xs font-medium">{copy.crop}</label><Select value={crop} onValueChange={value => { if (crops.includes(value as Crop)) void assess(point, value as Crop); }}><SelectTrigger aria-labelledby="crop-label" className="h-11 bg-card"><SelectValue /></SelectTrigger><SelectContent>{crops.map(value => <SelectItem key={value} value={value}>{copy.crops[value]}</SelectItem>)}</SelectContent></Select></div></div>
      </div>
      <div className="page-width">
        <ClientOnly fallback={mapFallback}><Suspense fallback={mapFallback}><SoilMap point={point} onSelect={p => { void assess(p, crop); }} /></Suspense></ClientOnly>
      </div>
      <section className="page-width pb-10 pt-7" aria-label={copy.report} aria-busy={loading}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{copy.report}<span className="ml-3 text-sm font-normal text-muted-foreground">/ {copy.crops[crop]}</span></h2><p className="flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="text-muted-foreground">{copy.selected}</span><span className="coordinate font-medium">{point.lat.toFixed(4)}° N, {point.lon.toFixed(4)}° E</span></p></div>
        <div className="report-body" aria-live="polite">
          {loading ? <div className="report-empty flex items-center gap-3 text-muted-foreground"><span className="soil-spinner" />{copy.loading}</div> : error ? <div className="report-empty text-muted-foreground">{copy.error}</div> : !report ? <div className="report-empty text-muted-foreground">{copy.empty}</div> : <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xs font-semibold text-muted-foreground">{copy.summary}</h3><div className="flex gap-4 text-[10px] text-muted-foreground">{(['good', 'warning', 'poor'] as Status[]).map(status => <span key={status} className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${statusClass[status]}`} />{statusLabel[status]}</span>)}</div></div>
            <div className="grid gap-x-12 gap-y-4 md:grid-cols-2">{report.summary.map(item => <p key={item.text} className="flex items-start gap-3 text-sm leading-relaxed"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${statusClass[item.status]}`} role="img" aria-label={statusLabel[item.status]} /><span>{String(copy[item.text as keyof typeof copy] ?? item.text)}</span></p>)}</div>
            <div className="mb-5 mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xs font-semibold text-muted-foreground">{copy.data}</h3>
                {report.subsoil && <div role="tablist" aria-label={copy.depths} className="flex gap-1 rounded-md border border-border bg-muted p-1">{(['surface', 'subsoil'] as Depth[]).map(d => <button key={d} type="button" role="tab" aria-selected={depth === d} onClick={() => setDepth(d)} className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${depth === d ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{d === 'surface' ? copy.depthSurface : copy.depthSubsoil}</button>)}</div>}
              </div>
              <span className="text-[10px] text-muted-foreground">{copy.measured}</span>
            </div>
            <dl className="soil-data grid grid-cols-2 gap-y-6 md:grid-cols-5">
              <Metric label={copy.labels.ph} value={layerAt(report, depth).ph.toFixed(1)} unit={copy.units.ph} />
              <Metric label={copy.labels.carbon} value={layerAt(report, depth).carbon.toFixed(2)} unit={copy.units.percent} />
              <Metric label={copy.labels.texture} value={copy.textures[layerAt(report, depth).texture as keyof typeof copy.textures] ?? layerAt(report, depth).texture} />
              <div className="metric"><dt>{copy.labels.fractions}</dt><dd className="mt-3 flex gap-3 text-lg font-medium">{[layerAt(report, depth).clay, layerAt(report, depth).sand, layerAt(report, depth).silt].map((value, index) => <span key={index}>{value}<span className="text-xs text-muted-foreground">%</span></span>)}</dd><div className="mt-2 flex gap-4 text-[10px] text-muted-foreground"><span>{copy.fractions.clay}</span><span>{copy.fractions.sand}</span><span>{copy.fractions.silt}</span></div></div>
              <Metric label={copy.labels.density} value={layerAt(report, depth).density.toFixed(2)} unit={copy.units.density} />
            </dl>
            <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-border pt-4 text-[11px] text-muted-foreground"><p>{copy.source}</p>{report.estimated && <p>{copy.estimated}</p>}</div>
          </>}
        </div>
      </section>
    </main>
    <footer className="border-t border-border"><div className="page-width flex flex-wrap justify-between gap-3 py-5 text-[10px] text-muted-foreground"><span>{copy.footer}</span><span>{copy.footerNote}</span></div></footer>
  </div>;
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return <div className="metric"><dt>{label}</dt><dd className="mt-3 text-[22px] leading-tight font-medium">{value}</dd>{unit && <p className="mt-2 text-[10px] text-muted-foreground">{unit}</p>}</div>;
}
