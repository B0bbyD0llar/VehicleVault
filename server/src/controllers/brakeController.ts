import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { z } from 'zod';

export const brakeMeasurementSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  odometer: z.number().nonnegative('Odometer must be non-negative'),
  pad_fl: z.number().nullable().optional(),
  pad_fr: z.number().nullable().optional(),
  pad_rl: z.number().nullable().optional(),
  pad_rr: z.number().nullable().optional(),
  disc_fl: z.enum(['good', 'moderate', 'worn', 'critical']).default('good'),
  disc_fr: z.enum(['good', 'moderate', 'worn', 'critical']).default('good'),
  disc_rl: z.enum(['good', 'moderate', 'worn', 'critical']).default('good'),
  disc_rr: z.enum(['good', 'moderate', 'worn', 'critical']).default('good'),
  notes: z.string().nullable().optional(),
});

export class BrakeController {
  public static async getMeasurements(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;

      // Access check
      const vehicle = db.get<any>(
        `SELECT v.* FROM vehicles v
         LEFT JOIN vehicle_shares s ON v.id = s.vehicle_id AND s.user_id = ?
         WHERE v.id = ? AND (v.user_id = ? OR s.user_id IS NOT NULL OR ? = 'admin')`,
        [userId, vehicleId, userId, req.user?.role]
      );

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        return;
      }

      const measurements = db.query<any>(
        'SELECT * FROM brake_measurements WHERE vehicle_id = ? ORDER BY date DESC, odometer DESC',
        [vehicleId]
      );

      res.json(measurements);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch brake measurements' });
    }
  }

  public static async createMeasurement(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;

      // Check edit access
      const vehicle = db.get<any>(
        `SELECT v.* FROM vehicles v
         LEFT JOIN vehicle_shares s ON v.id = s.vehicle_id AND s.user_id = ?
         WHERE v.id = ? AND (v.user_id = ? OR s.role = 'editor' OR ? = 'admin')`,
        [userId, vehicleId, userId, req.user?.role]
      );

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        return;
      }

      const parsed = brakeMeasurementSchema.parse(req.body);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      db.run(
        `INSERT INTO brake_measurements (
          id, vehicle_id, date, odometer,
          pad_fl, pad_fr, pad_rl, pad_rr,
          disc_fl, disc_fr, disc_rl, disc_rr,
          notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          vehicleId,
          parsed.date,
          parsed.odometer,
          parsed.pad_fl ?? null,
          parsed.pad_fr ?? null,
          parsed.pad_rl ?? null,
          parsed.pad_rr ?? null,
          parsed.disc_fl,
          parsed.disc_fr,
          parsed.disc_rl,
          parsed.disc_rr,
          parsed.notes ?? null,
          createdAt,
        ]
      );

      const created = db.get('SELECT * FROM brake_measurements WHERE id = ?', [id]);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', issues: err.errors });
        return;
      }
      res.status(500).json({ error: err.message || 'Failed to create brake measurement' });
    }
  }

  public static async deleteMeasurement(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, id } = req.params;
      const userId = req.user?.userId;

      const vehicle = db.get<any>(
        `SELECT v.* FROM vehicles v
         LEFT JOIN vehicle_shares s ON v.id = s.vehicle_id AND s.user_id = ?
         WHERE v.id = ? AND (v.user_id = ? OR s.role = 'editor' OR ? = 'admin')`,
        [userId, vehicleId, userId, req.user?.role]
      );

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found or unauthorized' });
        return;
      }

      db.run('DELETE FROM brake_measurements WHERE id = ? AND vehicle_id = ?', [id, vehicleId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete brake measurement' });
    }
  }
}
