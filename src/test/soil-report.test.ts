import { describe, expect, it, vi, afterEach } from 'vitest';
import { getSoilReport } from '@/lib/soil-report';

const apiPayload = {
  status: 'ok',
  raw_values: {
    '0-5cm': { phh2o: 6.2, soc: 0.6, nitrogen: 0.05, clay: 34, sand: 32, silt: 34, bdod: 1.3 },
    '5-15cm': { phh2o: 6.4, soc: 0.4, nitrogen: 0.04, clay: 36, sand: 30, silt: 34, bdod: 1.35 },
  },
  texture: { '0-5cm': 'clay loam', '5-15cm': 'clay loam' },
  flags: {
    ph: { value: 6.2, status: 'good' },
    soc: { value: 0.6, status: 'warning' },
    nitrogen: { value: 0.05, status: 'warning' },
    bulk_density: { value: 1.3, status: 'warning' },
    texture: 'clay loam',
  },
  sentences: ['Soil pH is well suited for this crop.', 'Organic matter is moderate.'],
  interpolated: true,
  source: 'SoilGrids',
};

afterEach(() => vi.unstubAllGlobals());

describe('Soil API data source', () => {
  it('maps both depth layers from the keyed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiPayload), { status: 200 }),
    ));
    const report = await getSoilReport(17.3, 73.3, 'Mango');
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.surface.ph).toBe(6.2);
    expect(report.surface.carbon).toBe(0.6);
    expect(report.surface.texture).toBe('clay loam');
    expect(report.surface.clay + report.surface.sand + report.surface.silt).toBe(100);
    expect(report.subsoil).not.toBeUndefined();
    expect(report.subsoil?.ph).toBe(6.4);
    expect(report.subsoil?.density).toBe(1.35);
    expect(report.subsoil?.clay + report.subsoil?.sand + report.subsoil?.silt).toBe(100);
    expect(report.estimated).toBe(true);
    expect(report.summary[0]).toEqual({ text: 'Soil pH is well suited for this crop.', status: 'good' });
  });

  it('still maps the older flat response shape to the surface layer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        ...apiPayload,
        raw_values: { phh2o: 6.2, soc: 0.6, nitrogen: 0.05, clay: 34, sand: 32, silt: 34, bdod: 1.3 },
        texture: 'clay loam',
      }), { status: 200 }),
    ));
    const report = await getSoilReport(17.3, 73.3, 'Mango');
    expect(report).not.toBeNull();
    expect(report?.surface.ph).toBe(6.2);
    expect(report?.subsoil).toBeUndefined();
  });

  it('returns null for no_data and passes lat, lon, crop and lang through', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'no_data' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await getSoilReport(17.3, 72, 'Cashew')).toBeNull();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('lat=17.3');
    expect(url).toContain('lon=72');
    expect(url).toContain('crop=Cashew');
    expect(url).toContain('lang=en');
  });

  it('throws on a failed request so the error state shows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('server error', { status: 500 }),
    ));
    await expect(getSoilReport(17.3, 73.3, 'Rice')).rejects.toThrow();
  });
});
