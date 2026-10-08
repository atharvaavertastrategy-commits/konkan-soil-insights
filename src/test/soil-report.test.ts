import { describe, expect, it } from 'vitest';
import { getSoilReport } from '@/lib/soil-report';

describe('Mock soil assessment', () => {
  it('provides coherent soil values for the Konkan coast', async () => {
    const report = await getSoilReport(17.3, 73.3, 'Mango');
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.clay + report.sand + report.silt).toBe(100);
    expect(report.summary).toHaveLength(4);
    expect(report.ph).toBeGreaterThan(5);
  });
  it('returns no data outside the demo coverage', async () => {
    expect(await getSoilReport(17.3, 72, 'Cashew')).toBeNull();
  });
  it('changes crop suitability and flags nearby estimates', async () => {
    const report = await getSoilReport(17.6, 73.5, 'Rice');
    expect(report?.summary[2]).toEqual({ text: 'riceWater', status: 'good' });
    expect(report?.estimated).toBe(true);
  });
});