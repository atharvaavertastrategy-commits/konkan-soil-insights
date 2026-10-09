import { type Crop } from './soil-copy';

export type Point = { lat: number; lon: number };
export type Status = 'good' | 'warning' | 'poor';
export type SoilReport = {
  ph: number; carbon: number; texture: string;
  clay: number; sand: number; silt: number; density: number; estimated: boolean;
  summary: { text: string; status: Status }[];
};
export const initialPoint: Point = { lat: 17.3, lon: 73.3 };

// Report shown for the starting location before the first API call.
export const initialReport: SoilReport = {
  ph: 6.1, carbon: 0.55, texture: 'clayLoam', clay: 35, sand: 32, silt: 33,
  density: 1.32, estimated: false,
  summary: [
    { text: 'phGood', status: 'good' },
    { text: 'organic', status: 'warning' },
    { text: 'water', status: 'warning' },
    { text: 'drainage', status: 'warning' },
  ],
};

type SoilApiFlag = { value: number; status: string };
type SoilApiResponse = {
  status: 'ok' | 'no_data';
  raw_values: { phh2o: number; soc: number; nitrogen: number; clay: number; sand: number; silt: number; bdod: number };
  texture: string;
  flags: { ph: SoilApiFlag; soc: SoilApiFlag; nitrogen: SoilApiFlag; bulk_density: SoilApiFlag; texture: string };
  sentences: string[];
  interpolated: boolean;
  source: string;
};

// Base URL comes from .env (VITE_SOIL_API_BASE) so a deployed backend can be
// used later without touching code.
const API_BASE = import.meta.env.VITE_SOIL_API_BASE ?? 'http://localhost:8000';

function normalizeStatus(status: string | undefined): Status {
  return status === 'good' || status === 'poor' ? status : 'warning';
}

function mapReport(data: SoilApiResponse): SoilReport {
  const flagStatuses = [
    data.flags.ph.status, data.flags.soc.status,
    data.flags.nitrogen.status, data.flags.bulk_density.status,
  ];
  return {
    ph: data.raw_values.phh2o,
    carbon: data.raw_values.soc,
    texture: data.texture,
    clay: data.raw_values.clay, sand: data.raw_values.sand, silt: data.raw_values.silt,
    density: data.raw_values.bdod,
    estimated: data.interpolated,
    summary: data.sentences.map((text, index) => ({ text, status: normalizeStatus(flagStatuses[index]) })),
  };
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
