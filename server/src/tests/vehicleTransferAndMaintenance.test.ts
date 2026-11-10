import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/database.js';
import { VehicleShareController } from '../controllers/vehicleShareController.js';
import crypto from 'node:crypto';

describe('Vehicle Transfer Ownership & Maintenance Notification Improvements', () => {
  it('should transfer vehicle ownership completely to another user', async () => {
    const ownerId = crypto.randomUUID();
    const buyerId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sellerEmail = `seller_${crypto.randomUUID().slice(0, 8)}@test.local`;
    const buyerEmail = `buyer_${crypto.randomUUID().slice(0, 8)}@test.local`;

    db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      ownerId,
      sellerEmail,
      'hash',
      'user',
      now,
      now,
    ]);
    db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      buyerId,
      buyerEmail,
      'hash',
      'user',
      now,
      now,
    ]);
    db.run('INSERT INTO vehicles (id, user_id, name, type, license_plate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      vehicleId,
      ownerId,
      'Transfer Test Car',
      'car',
      'TR-88-XX',
      now,
      now,
    ]);

    let resJson: any = null;
    let resStatus = 200;
    const req: any = {
      params: { id: vehicleId },
      user: { userId: ownerId, role: 'user' },
      body: { email: buyerEmail, retain_access: false },
      get: () => 'localhost',
      protocol: 'http',
    };
    const res: any = {
      status: (code: number) => {
        resStatus = code;
        return res;
      },
      json: (data: any) => {
        resJson = data;
      },
    };

    await VehicleShareController.transferOwnership(req, res);

    assert.equal(resStatus, 200);
    assert.equal(resJson.success, true);
    assert.equal(resJson.newOwner, buyerEmail);

    const updatedVehicle = db.get<any>('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    assert.equal(updatedVehicle.user_id, buyerId);

    // Former owner should not have a share record
    const formerShare = db.get<any>('SELECT * FROM vehicle_shares WHERE vehicle_id = ? AND user_id = ?', [vehicleId, ownerId]);
    assert.equal(formerShare, undefined);
  });

  it('should support transferring ownership while retaining co-driver editor access', async () => {
    const ownerId = crypto.randomUUID();
    const buyerId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sellerEmail = `seller2_${crypto.randomUUID().slice(0, 8)}@test.local`;
    const buyerEmail = `buyer2_${crypto.randomUUID().slice(0, 8)}@test.local`;

    db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      ownerId,
      sellerEmail,
      'hash',
      'user',
      now,
      now,
    ]);
    db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      buyerId,
      buyerEmail,
      'hash',
      'user',
      now,
      now,
    ]);
    db.run('INSERT INTO vehicles (id, user_id, name, type, license_plate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      vehicleId,
      ownerId,
      'Retain Test Car',
      'car',
      'RT-99-ZZ',
      now,
      now,
    ]);

    let resJson: any = null;
    const req: any = {
      params: { id: vehicleId },
      user: { userId: ownerId, role: 'user' },
      body: { email: buyerEmail, retain_access: true },
      get: () => 'localhost',
      protocol: 'http',
    };
    const res: any = {
      status: () => res,
      json: (data: any) => {
        resJson = data;
      },
    };

    await VehicleShareController.transferOwnership(req, res);

    assert.equal(resJson.success, true);
    const updatedVehicle = db.get<any>('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    assert.equal(updatedVehicle.user_id, buyerId);

    // Former owner should now have editor access in vehicle_shares
    const formerShare = db.get<any>('SELECT * FROM vehicle_shares WHERE vehicle_id = ? AND user_id = ?', [vehicleId, ownerId]);
    assert.ok(formerShare);
    assert.equal(formerShare.role, 'editor');
  });

  it('should reject transferring to the current owner', async () => {
    const ownerId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const selfEmail = `self_${crypto.randomUUID().slice(0, 8)}@test.local`;

    db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      ownerId,
      selfEmail,
      'hash',
      'user',
      now,
      now,
    ]);
    db.run('INSERT INTO vehicles (id, user_id, name, type, license_plate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      vehicleId,
      ownerId,
      'Self Car',
      'car',
      'SL-00-FF',
      now,
      now,
    ]);

    let resStatus = 200;
    let resJson: any = null;
    const req: any = {
      params: { id: vehicleId },
      user: { userId: ownerId, role: 'user' },
      body: { email: selfEmail },
      get: () => 'localhost',
      protocol: 'http',
    };
    const res: any = {
      status: (code: number) => {
        resStatus = code;
        return res;
      },
      json: (data: any) => {
        resJson = data;
      },
    };

    await VehicleShareController.transferOwnership(req, res);
    assert.equal(resStatus, 400);
    assert.match(resJson.error, /al eigendom/i);
  });
});
