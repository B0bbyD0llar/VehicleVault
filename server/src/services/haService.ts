import { db } from '../db/database.js';
import { RdwService } from './rdwService.js';
import { MaintenanceService } from './maintenanceService.js';

export interface HaVehicleSensorData {
  id: string;
  name: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string;
  image_url: string | null;
  odometer: number;
  apk: {
    expiration_date: string | null;
    days_remaining: number | null;
    status: 'ok' | 'due_soon' | 'overdue' | 'unknown';
  };
  fuel_stats: {
    total_entries: number;
    consumption_l_per_100km: number | null;
    consumption_km_per_liter: number | null;
    last_fuel_date: string | null;
    last_fuel_odometer: number | null;
    last_fuel_cost: number | null;
    last_fuel_liters: number | null;
    last_fuel_price_per_liter: number | null;
    last_station_name: string | null;
    last_energy_type: string | null;
    last_kwh: number | null;
  };
  maintenance: {
    alerts_count: number;
    alerts: Array<{
      item: string;
      status: 'good' | 'warning' | 'overdue';
      remaining_km: number | null;
      remaining_days: number | null;
    }>;
  };
  attributes: Record<string, any>;
}

export class HaService {
  public static getSensorsPayload(userId?: string): {
    status: string;
    version: string;
    timestamp: string;
    total_vehicles: number;
    vehicles: HaVehicleSensorData[];
  } {
    const vehicles = userId
      ? db.query<any>(
          `
          SELECT v.*,
            MAX(COALESCE(f.max_f, 0), COALESCE(s.max_s, 0), COALESCE(o.max_o, 0), COALESCE(t.max_t, 0), v.initial_odometer) as current_odometer
          FROM vehicles v
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_f FROM fuel_entries GROUP BY vehicle_id) f ON f.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_s FROM service_records GROUP BY vehicle_id) s ON s.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_o FROM odometer_logs GROUP BY vehicle_id) o ON o.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(end_odometer) as max_t FROM trips GROUP BY vehicle_id) t ON t.vehicle_id = v.id
          WHERE v.status = 'active'
            AND (v.user_id = ? OR v.id IN (SELECT vehicle_id FROM vehicle_shares WHERE user_id = ?))
          GROUP BY v.id
          ORDER BY v.created_at ASC
          `,
          [userId, userId]
        )
      : db.query<any>(`
          SELECT v.*,
            MAX(COALESCE(f.max_f, 0), COALESCE(s.max_s, 0), COALESCE(o.max_o, 0), COALESCE(t.max_t, 0), v.initial_odometer) as current_odometer
          FROM vehicles v
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_f FROM fuel_entries GROUP BY vehicle_id) f ON f.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_s FROM service_records GROUP BY vehicle_id) s ON s.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(odometer) as max_o FROM odometer_logs GROUP BY vehicle_id) o ON o.vehicle_id = v.id
          LEFT JOIN (SELECT vehicle_id, MAX(end_odometer) as max_t FROM trips GROUP BY vehicle_id) t ON t.vehicle_id = v.id
          WHERE v.status = 'active'
          GROUP BY v.id
          ORDER BY v.created_at ASC
        `);

    const resultVehicles: HaVehicleSensorData[] = vehicles.map((v) => {
      // 1. APK calculation
      const apkEval = RdwService.evaluateApkStatus(v.apk_expiration_date);
      let apkStatus: 'ok' | 'due_soon' | 'overdue' | 'unknown' = 'unknown';
      if (apkEval.isOverdue) apkStatus = 'overdue';
      else if (apkEval.isDueSoon) apkStatus = 'due_soon';
      else if (apkEval.daysRemaining !== null) apkStatus = 'ok';

      // 2. Fuel entries & consumption
      const fuelEntries = db.query<any>(
        'SELECT * FROM fuel_entries WHERE vehicle_id = ? ORDER BY odometer ASC',
        [v.id]
      );

      let lPer100km: number | null = null;
      let kmPerL: number | null = null;
      if (fuelEntries.length >= 2) {
        const first = fuelEntries[0];
        const last = fuelEntries[fuelEntries.length - 1];
        const deltaKm = last.odometer - first.odometer;
        const totalLiters = fuelEntries.slice(1).reduce((acc: number, cur: any) => acc + (cur.liters || 0), 0);
        if (deltaKm > 0 && totalLiters > 0) {
          lPer100km = Math.round((totalLiters / deltaKm) * 100 * 100) / 100;
          kmPerL = Math.round((deltaKm / totalLiters) * 100) / 100;
        }
      }

      const lastFuel = fuelEntries.length > 0 ? fuelEntries[fuelEntries.length - 1] : null;
      const currentOdo = Number(v.current_odometer) || 0;

      // 3. Maintenance intervals via unified MaintenanceService
      const maintStatuses = MaintenanceService.getVehicleMaintenanceStatus(v.id);
      const alerts = maintStatuses
        .filter((s) => s.status === 'overdue' || s.status === 'warning')
        .map((s) => ({
          item: s.customName || s.categoryName,
          status: s.status,
          remaining_km: s.kmRemaining,
          remaining_days: s.daysRemaining,
        }));

      return {
        id: v.id,
        name: v.name,
        license_plate: v.license_plate || null,
        make: v.make || null,
        model: v.model || null,
        year: v.year || null,
        status: v.status,
        image_url: v.image_path ? `/uploads/vehicles/${v.image_path}` : null,
        odometer: currentOdo,
        apk: {
          expiration_date: v.apk_expiration_date || null,
          days_remaining: apkEval.daysRemaining,
          status: apkStatus,
        },
        fuel_stats: {
          total_entries: fuelEntries.length,
          consumption_l_per_100km: lPer100km,
          consumption_km_per_liter: kmPerL,
          last_fuel_date: lastFuel?.date || null,
          last_fuel_odometer: lastFuel?.odometer || null,
          last_fuel_cost: lastFuel?.total_cost || null,
          last_fuel_liters: lastFuel?.liters || null,
          last_fuel_price_per_liter: lastFuel?.price_per_liter || null,
          last_station_name: lastFuel?.station_name || null,
          last_energy_type: lastFuel?.energy_type || 'fuel',
          last_kwh: lastFuel?.kwh || null,
        },
        maintenance: {
          alerts_count: alerts.length,
          alerts,
        },
        attributes: {
          license_plate: v.license_plate,
          image_url: v.image_path ? `/uploads/vehicles/${v.image_path}` : null,
          odometer_km: currentOdo,
          apk_status: apkStatus,
          apk_days_remaining: apkEval.daysRemaining,
          consumption_l_100km: lPer100km,
          last_fuel_liters: lastFuel?.liters || 0,
          last_fuel_cost: lastFuel?.total_cost || 0,
          maintenance_alerts_count: alerts.length,
        },
      };
    });

    return {
      status: 'ok',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      total_vehicles: resultVehicles.length,
      vehicles: resultVehicles,
    };
  }
}

