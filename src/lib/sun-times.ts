/**
 * Approximate sunrise / sunset / isha for a given lat/lon on a given date.
 *
 * Uses the NOAA solar position simplification (good to within a couple of
 * minutes for civil purposes). Isha here is defined as 18 below horizon
 * (astronomical dusk) — when the sky goes truly dark.
 */

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

function solarDeclinationRad(n: number): number {
  // Approximation of solar declination angle in radians.
  return (-23.44 * Math.PI / 180) * Math.cos((2 * Math.PI / 365) * (n + 10));
}

/**
 * Given the elevation angle threshold (e.g. -0.833 for sunrise/sunset,
 * -18 for astronomical dusk / isha), return the local-time hour offset from
 * solar noon at which the sun crosses that elevation.
 *
 * Returns null if the sun never crosses (polar day/night).
 */
function hourAngleHours(latRad: number, declRad: number, elevDeg: number): number | null {
  const elevRad = (elevDeg * Math.PI) / 180;
  const cosH =
    (Math.sin(elevRad) - Math.sin(latRad) * Math.sin(declRad)) /
    (Math.cos(latRad) * Math.cos(declRad));
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH);
  return (H * 180) / Math.PI / 15;
}

function formatHHMM(hours: number): string {
  const wrapped = ((hours % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.round((wrapped - h) * 60);
  // Handle minute carry.
  const mm = m === 60 ? 0 : m;
  const hh = m === 60 ? (h + 1) % 24 : h;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export interface SunTimes {
  sunrise: string;
  sunset: string;
  isha: string;
}

export function computeSunTimes(
  date: Date,
  lat: number,
  lon: number,
): SunTimes | null {
  const n = dayOfYear(date);
  const decl = solarDeclinationRad(n);
  const latRad = (lat * Math.PI) / 180;
  const tzOffsetHours = -date.getTimezoneOffset() / 60;

  // Solar noon (UTC) for the longitude.
  const solarNoonUTC = 12 - lon / 15;

  const haRise = hourAngleHours(latRad, decl, -0.833);
  const haIsha = hourAngleHours(latRad, decl, -18);
  if (haRise == null) return null;

  const sunriseLocal = solarNoonUTC - haRise + tzOffsetHours;
  const sunsetLocal = solarNoonUTC + haRise + tzOffsetHours;
  const ishaLocal =
    haIsha != null
      ? solarNoonUTC + haIsha + tzOffsetHours
      : sunsetLocal + 1.5; // fallback ~90 min after sunset

  return {
    sunrise: formatHHMM(sunriseLocal),
    sunset: formatHHMM(sunsetLocal),
    isha: formatHHMM(ishaLocal),
  };
}
