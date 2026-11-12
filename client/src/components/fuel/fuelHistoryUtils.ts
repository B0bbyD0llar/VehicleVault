import { FuelEntry } from '../../types/index.js';

export function calculateFuelAverages(entries: FuelEntry[]) {
  const solo = { km: 0, liters: 0 };
  const towing = { km: 0, liters: 0 };

  for (let i = 0; i < entries.length - 1; i++) {
    const curr = entries[i];
    const prev = entries[i + 1];
    if (curr.is_full_tank && !curr.missed_previous && prev.is_full_tank) {
      const deltaKm = curr.odometer - prev.odometer;
      if (deltaKm > 0 && curr.liters > 0) {
        const target = curr.is_towing ? towing : solo;
        target.km += deltaKm;
        target.liters += curr.liters;
      }
    }
  }

  return {
    soloAvgKmL: solo.liters > 0 ? solo.km / solo.liters : null,
    soloAvgL100: solo.km > 0 ? (solo.liters / solo.km) * 100 : null,
    towingAvgKmL: towing.liters > 0 ? towing.km / towing.liters : null,
    towingAvgL100: towing.km > 0 ? (towing.liters / towing.km) * 100 : null,
  };
}

export function computeEconomyText(curr: FuelEntry, prev?: FuelEntry): string | null {
  if (curr.is_full_tank && !curr.missed_previous && prev && prev.is_full_tank) {
    const deltaKm = curr.odometer - prev.odometer;
    if (deltaKm > 0 && curr.liters > 0) {
      const kmPerLiter = deltaKm / curr.liters;
      const litersPer100Km = (curr.liters / deltaKm) * 100;
      return `1 op ${kmPerLiter.toFixed(1)} (${litersPer100Km.toFixed(1)} L/100)`;
    }
  }
  return null;
}
