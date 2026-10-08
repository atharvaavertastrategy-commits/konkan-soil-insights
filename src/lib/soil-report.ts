import { copy, type Crop } from './soil-copy';

export type Point = { lat: number; lon: number };
export type Status = 'good' | 'warning' | 'poor';
export type SoilReport = {
  ph: number; carbon: number; texture: keyof typeof copy.textures;
  clay: number; sand: number; silt: number; density: number; estimated: boolean;
  summary: { text: keyof typeof copy; status: Status }[];
};
export const initialPoint: Point = { lat: 17.3, lon: 73.3 };

function modelReport(lat: number, lon: number, crop: Crop): SoilReport | null {
  // Coarse coastal envelope for demo coverage, not a survey boundary.
  const coast = 72.75 + (19.5 - lat) * 0.24;
  if (lat < 15.6 || lat > 19.9 || lon < coast || lon > coast + 0.9) return null;
  const variation = Math.abs(Math.sin(lat * 3 + lon * 2));
  const ph = Number((5.7 + variation * 0.9).toFixed(1));
  const clay = Math.round(31 + variation * 8);
  const sand = Math.round(34 - variation * 5);
  const phGood = crop === 'Cashew' ? ph >= 5 : ph >= 5.5;
  return {
    ph, carbon: Number((0.55 + variation * 0.22).toFixed(2)),
    texture: 'clayLoam', clay, sand, silt: 100 - clay - sand,
    density: Number((1.26 + variation * 0.12).toFixed(2)),
    estimated: Math.abs(lat - initialPoint.lat) > 0.15,
    summary: [
      { text: phGood ? 'phGood' : 'phPoor', status: phGood ? 'good' : 'poor' },
      { text: 'organic', status: 'warning' },
      { text: crop === 'Rice' ? 'riceWater' : 'water', status: crop === 'Rice' ? 'good' : 'warning' },
      { text: 'drainage', status: crop === 'Rice' ? 'good' : 'warning' },
    ],
  };
}
export const initialReport = modelReport(initialPoint.lat, initialPoint.lon, 'Mango');

// Replace this function's body with the real API request; keep its typed contract.
// The modeled values below are synthetic placeholders, not field measurements.
export async function getSoilReport(lat: number, lon: number, crop: Crop): Promise<SoilReport | null> {
  await new Promise(resolve => setTimeout(resolve, 650));
  return modelReport(lat, lon, crop);
}