import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { BrakeController } from '../controllers/brakeController.js';
import { HaController } from '../controllers/haController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { TcoService } from '../services/tcoService.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: { userId: 'test-user-v3', email: 'v3@vehiclevault.local', role: 'admin' },
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('VehicleVault v3.0 Milestone Features & Modernization', () => {
  const testUserId = 'test-v3-user-' + crypto.randomUUID();
  const testVehicleId = 'test-v3-vehicle-' + crypto.randomUUID();

  it('sets up a test vehicle and user for v3 testing', () => {
    initializeDatabase();

    db.run(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, 'hash', 'user', datetime('now'), datetime('now'))`,
      [testUserId, `v3_${Date.now()}@test.local`]
    );

    db.run(
      `INSERT INTO vehicles (id, user_id, name, license_plate, initial_odometer, created_at, updated_at)
       VALUES (?, ?, 'V3 Testcar', 'V3-TEST-01', 10000, datetime('now'), datetime('now'))`,
      [testVehicleId, testUserId]
    );

    const v = db.get<any>('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
    assert.ok(v);
    assert.equal(v.license_plate, 'V3-TEST-01');
  });

  it('records, lists and deletes brake measurements per wheel corner (Brakes Tracking)', async () => {
    const req = mockReq({
      params: { vehicleId: testVehicleId },
      user: { userId: testUserId, role: 'user' },
      body: {
        date: '2026-11-02',
        odometer: 15400,
        pad_fl: 8.5,
        pad_fr: 8.5,
        pad_rl: 7.0,
        pad_rr: 6.8,
        disc_fl: 'good',
        disc_fr: 'good',
        disc_rl: 'moderate',
        disc_rr: 'moderate',
        notes: 'Winter tyre change inspection',
      },
    });
    const res = mockRes();

    await BrakeController.createMeasurement(req, res);
    assert.equal(res.statusCode, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.pad_fl, 8.5);
    assert.equal(res.body.disc_rl, 'moderate');

    const createdId = res.body.id;

    // List measurements
    const listReq = mockReq({
      params: { vehicleId: testVehicleId },
      user: { userId: testUserId, role: 'user' },
    });
    const listRes = mockRes();
    await BrakeController.getMeasurements(listReq, listRes);
    assert.equal(listRes.statusCode, 200);
    assert.ok(Array.isArray(listRes.body));
    assert.ok(listRes.body.length >= 1);
    assert.equal(listRes.body[0].notes, 'Winter tyre change inspection');

    // Delete measurement
    const delReq = mockReq({
      params: { vehicleId: testVehicleId, id: createdId },
      user: { userId: testUserId, role: 'user' },
    });
    const delRes = mockRes();
    await BrakeController.deleteMeasurement(delReq, delRes);
    assert.equal(delRes.statusCode, 200);
    assert.equal(delRes.body.success, true);
  });

  it('calculates separate normal vs. towing fuel consumption when caravan flag is set', () => {
    // Insert normal fueling entries
    const f1Id = crypto.randomUUID();
    const f2Id = crypto.randomUUID();
    const f3Id = crypto.randomUUID();

    // Leg 1: 10000 -> 10500 km (500 km, 25 L) = 5.0 L/100km (Solo)
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-01', 10000, 40, 2.0, 80, 1, 0, datetime('now'))`,
      [f1Id, testVehicleId]
    );
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-10', 10500, 25, 2.0, 50, 1, 0, datetime('now'))`,
      [f2Id, testVehicleId]
    );

    // Leg 2: 10500 -> 10900 km (400 km, 40 L) = 10.0 L/100km (Towing Caravan)
    db.run(
      `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, liters, price_per_liter, total_cost, is_full_tank, is_towing, created_at)
       VALUES (?, ?, '2026-06-20', 10900, 40, 2.0, 80, 1, 1, datetime('now'))`,
      [f3Id, testVehicleId]
    );

    const tco = TcoService.calculateTco({ vehicleId: testVehicleId });

    assert.ok(tco.fuelStats);
    assert.equal(tco.fuelStats.avgNormalLPer100Km, 5); // 5.0 L/100km solo
    assert.equal(tco.fuelStats.avgTowingLPer100Km, 10); // 10.0 L/100km towing
  });

  it('aggregates multi-vehicle Fleet TCO and cost distribution', async () => {
    const req = mockReq({
      user: { userId: testUserId, role: 'admin' },
      query: {},
    });
    const res = mockRes();

    await AnalyticsController.getFleetTco(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.fleetTotalCost > 0);
    assert.ok(res.body.vehicleCount >= 1);
    assert.ok(Array.isArray(res.body.vehicles));
    assert.ok(Array.isArray(res.body.monthlyBreakdown));
  });

  it('ingests universal telemetry webhook and updates vehicle odometer logs', async () => {
    const req = mockReq({
      user: { userId: testUserId, role: 'user' },
      body: {
        vehicle_id: testVehicleId,
        odometer: 11250,
        source: 'home_assistant_wican_obd2',
      },
    });
    const res = mockRes();

    await HaController.updateOdometer(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.odometer, 11250);

    const latestLog = db.get<any>(
      'SELECT * FROM odometer_logs WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1',
      [testVehicleId]
    );
    assert.ok(latestLog);
    assert.equal(latestLog.odometer, 11250);
    assert.equal(latestLog.source, 'home_assistant_wican_obd2');
  });

  it('enforces Zod runtime validation middleware and rejects malformed inputs', () => {
    const testSchema = z.object({
      license_plate: z.string().min(2),
      odometer: z.number().positive(),
    });

    const middleware = validateBody(testSchema);

    // Invalid body test
    const badReq: any = { body: { license_plate: 'X', odometer: -50 } };
    const badRes = mockRes();
    let nextCalled = false;

    middleware(badReq, badRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(badRes.statusCode, 400);
    assert.equal(badRes.body.error, 'Validation failed');
    assert.ok(badRes.body.issues.length >= 2);

    // Valid body test
    const goodReq: any = { body: { license_plate: 'XX-123-Y', odometer: 50000 } };
    const goodRes = mockRes();
    let goodNextCalled = false;

    middleware(goodReq, goodRes, () => {
      goodNextCalled = true;
    });

    assert.equal(goodNextCalled, true);
    assert.equal(goodReq.body.license_plate, 'XX-123-Y');
    assert.equal(goodReq.body.odometer, 50000);
  });
});
