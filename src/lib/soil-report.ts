import { type Crop } from './soil-copy';

export type Point = { lat: number; lon: number };
export type Status = 'good' | 'warning' | 'poor';
export type SoilLayer = {
  ph: number; carbon: number; texture: string;
  clay: number; sand: number; silt: number; density: number;
};
export type SoilReport = {
  surface: SoilLayer;
  subsoil?: SoilLayer;
  estimated: boolean;
  summary: { text: string; status: Status }[];
};
export const initialPoint: Point = { lat: 17.3, lon: 73.3 };

// Report shown for the starting location before the first API call.
export const initialReport: SoilReport = {
  surface: { ph: 6.1, carbon: 0.55, texture: 'clayLoam', clay: 35, sand: 32, silt: 33, density: 1.32 },
  subsoil: { ph: 6.3, carbon: 0.42, texture: 'clayLoam', clay: 37, sand: 30, silt: 33, density: 1.38 },
  estimated: false,
  summary: [
    { text: 'phGood', status: 'good' },
    { text: 'organic', status: 'warning' },
    { text: 'water', status: 'warning' },
    { text: 'drainage', status: 'warning' },
  ],
};

type SoilApiValues = { phh2o: number; soc: number; nitrogen: number; clay: number; sand: number; silt: number; bdod: number };
type SoilApiFlag = { value: number; status: string };
type SoilApiResponse = {
  status: 'ok' | 'no_data';
  // Values keyed by depth ("0-5cm", "5-15cm"). Older flat responses are
  // normalized in mapReport.
  raw_values: { [depth: string]: SoilApiValues };
  texture: { [depth: string]: string } | string;
  flags: { ph: SoilApiFlag; soc: SoilApiFlag; nitrogen: SoilApiFlag; bulk_density: SoilApiFlag; texture: string };
  sentences: string[];
  interpolated: boolean;
  source: string;
};

// Base URL comes from .env (VITE_SOIL_API_BASE) so a deployed backend can be
// used later without touching code.
const API_BASE = import.meta.env['VITE_SOIL_API_BASE'] ?? 'http://localhost:8000';

function normalizeStatus(status: string | undefined): Status {
  return status === 'good' || status === 'poor' ? status : 'warning';
}

function toLayer(values: SoilApiValues, texture: string): SoilLayer {
  return {
    ph: values.phh2o, carbon: values.soc, texture,
    clay: values.clay, sand: values.sand, silt: values.silt, density: values.bdod,
  };
}

function mapReport(data: SoilApiResponse): SoilReport {
  const flagStatuses = [
    data.flags.ph.status, data.flags.soc.status,
    data.flags.nitrogen.status, data.flags.bulk_density.status,
  ];
  const summary = data.sentences.map((text, index) => ({ text, status: normalizeStatus(flagStatuses[index]) }));
  const raw = data.raw_values;
  // Older flat shape: raw_values is the single layer itself and texture a
  // plain string — mapped to the surface layer only.
  if ('phh2o' in raw) {
    const texture = typeof data.texture === 'string' ? data.texture : '';
    return { surface: toLayer(raw as unknown as SoilApiValues, texture), estimated: data.interpolated, summary };
  }
  const textureAt = (depth: string) => (typeof data.texture === 'string' ? data.texture : data.texture[depth] ?? '');
  const surface = raw['0-5cm'] ? toLayer(raw['0-5cm'], textureAt('0-5cm')) : undefined;
  const subsoil = raw['5-15cm'] ? toLayer(raw['5-15cm'], textureAt('5-15cm')) : undefined;
  if (!surface) throw new Error('Soil API response has no surface values');
  return { surface, estimated: data.interpolated, summary, ...(subsoil ? { subsoil } : {}) };
}

// Real data source: FastAPI backend (GET /soil-report). Same typed contract
// and signature as the mock this function replaces.
export async function getSoilReport(lat: number, lon: number, crop: Crop, lang = 'en'): Promise<SoilReport | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), crop, lang });
  const response = await fetch(`${API_BASE}/soil-report?${params.toString()}`);
  if (!response.ok) throw new Error(`Soil API request failed with status ${response.status}`);
  const data: SoilApiResponse = await response.json();
  if (data.status !== 'ok') return null;
  return mapReport(data);
}
