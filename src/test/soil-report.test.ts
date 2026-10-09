import { describe, expect, it, vi, afterEach } from 'vitest';
import { getSoilReport } from '@/lib/soil-report';

const apiPayload = {
  status: 'ok',
  raw_values: { phh2o: 6.2, soc: 0.6, nitrogen: 0.05, clay: 34, sand: 32, silt: 34, bdod: 1.3 },
  texture: 'Clay Loam',
  flags: {
    ph: { value: 6.2, status: 'good' },
    soc: { value: 0.6, status: 'warning' },
    nitrogen: { value: 0.05, status: 'warning' },
    bulk_density: { value: 1.3, status: 'warning' },
    texture: 'Clay Loam',
  },
  sentences: ['Soil pH is well suited for this crop.', 'Organic matter is moderate.'],
  interpolated: true,
  source: 'SoilGrids',
};

afterEach(() => vi.unstubAllGlobals());

describe('Soil API data source', () => {
  it('maps a successful API response to the report shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(apiPayload), { status: 200 }),
    ));
    const report = await getSoilReport(17.3, 73.3, 'Mango');
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.clay + report.sand + report.silt).toBe(100);
    expect(report.ph).toBe(6.2);
    expect(report.carbon).toBe(0.6);
    expect(report.density).toBe(1.3);
    expect(report.estimated).toBe(true);
    expect(report.summary[0]).toEqual({ text: 'Soil pH is well suited for this crop.', status: 'good' });
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
