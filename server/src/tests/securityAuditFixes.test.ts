import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { initializeDatabase } from '../db/schema.js';
import { generateAccessToken, generate2FaTempToken, verifyAccessToken } from '../utils/token.js';
import { validateSafeExternalUrl } from '../services/telematicsService.js';
import { CalendarService } from '../services/calendarService.js';
import { executeMcpTool } from '../mcp/tools.js';
import { ShowcaseZipService } from '../services/showcaseZipService.js';
import AdmZip from 'adm-zip';

describe('Security Audit Regression Tests', () => {
  initializeDatabase();

  it('rejects 2FA tempToken in verifyAccessToken', () => {
    const temp = generate2FaTempToken({ userId: 'u-1', email: 'a@test.local' });
    assert.equal(verifyAccessToken(temp), null);

    const access = generateAccessToken({ userId: 'u-1', email: 'a@test.local', role: 'user', tokenVersion: 0 });
    const decoded = verifyAccessToken(access);
    assert.ok(decoded);
    assert.equal(decoded?.userId, 'u-1');
  });

  it('blocks loopback and IPv4-mapped IPv6 metadata URLs in validateSafeExternalUrl', () => {
    assert.throws(() => validateSafeExternalUrl('http://127.0.0.1:8123'));
    assert.throws(() => validateSafeExternalUrl('http://localhost:8123'));
    assert.throws(() => validateSafeExternalUrl('http://[::1]:8123'));
    assert.throws(() => validateSafeExternalUrl('http://[::ffff:169.254.169.254]/latest/meta-data'));
    assert.equal(validateSafeExternalUrl('http://homeassistant.local:8123/'), 'http://homeassistant.local:8123');
  });

  it('enforces userId scoping in CalendarService.generateIcs even when vehicleId is provided', () => {
    const ownerId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [ownerId, `cal-owner-${ownerId}@test.local`, 'x', 'user', now, now]
    );
    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [otherId, `cal-other-${otherId}@test.local`, 'x', 'user', now, now]
    );
    db.run(
      'INSERT INTO vehicles (id, user_id, name, type, license_plate, apk_expiration_date, status, initial_odometer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicleId, ownerId, 'Secret Car', 'car', 'XX-99-YY', '2027-12-31', 'active', 0, now, now]
    );

    const ownerIcs = CalendarService.generateIcs(vehicleId, ownerId);
    assert.ok(ownerIcs.includes('Secret Car'));

    const otherIcs = CalendarService.generateIcs(vehicleId, otherId);
    assert.equal(otherIcs.includes('Secret Car'), false);
  });

  it('blocks cross-tenant access in executeMcpTool when userId is provided', async () => {
    const ownerId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [ownerId, `mcp-owner-${ownerId}@test.local`, 'x', 'user', now, now]
    );
    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [otherId, `mcp-other-${otherId}@test.local`, 'x', 'user', now, now]
    );
    db.run(
      'INSERT INTO vehicles (id, user_id, name, type, status, initial_odometer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicleId, ownerId, 'MCP Car', 'car', 'active', 0, now, now]
    );

    await assert.rejects(
      () => executeMcpTool('get_vehicle_summary', { vehicle_id: vehicleId }, otherId),
      /Unauthorized/
    );
    await assert.rejects(
      () => executeMcpTool('log_fuel_entry', { vehicle_id: vehicleId, odometer: 200, liters: 10, price_per_liter: 2 }, otherId),
      /Unauthorized/
    );
  });

  it('escapes contact_email and license_plate in ShowcaseZipService output', async () => {
    const showcase: any = {
      id: 's1',
      vehicle_id: 'v1',
      public_slug: 'test',
      is_active: true,
      asking_price: 10000,
      price_label: 'Vraagprijs',
      title: 'Test Auto',
      subtitle: 'Sub',
      highlights: [],
      options_list: [],
      transparency_notes: '',
      contact_whatsapp: null,
      contact_phone: null,
      contact_email: 'a" onmouseover="alert(1)',
      contact_location: null,
      show_maintenance_history: false,
      show_tire_status: false,
      show_rdw_specs: false,
      vehicle: {
        id: 'v1',
        name: 'Test Auto',
        type: 'car',
        license_plate: '";alert(1);//',
        vin: null,
        year: 2020,
        make: 'Test',
        model: 'Car',
        fuel_type: 'Benzine',
        current_odometer: 1000,
        apk_expiration_date: null,
      },
      stats: { bouwjaar: '2020', kilometerstand: '1.000 km', brandstof_transmissie: 'Benzine', vermogen: '-', apk: '-' },
      rdw_specs: null,
      photos: [],
      maintenance_records: [],
      tires: null,
    };

    const zipBuf = await ShowcaseZipService.generateZip(showcase);
    const zip = new AdmZip(zipBuf);
    const html = zip.readAsText('index.html');
    const js = zip.readAsText('js/app.js');

    assert.equal(html.includes('" onmouseover="alert(1)'), false);
    assert.equal(js.includes('";alert(1)'), false);
    assert.equal(js.includes('";ALERT(1)'), false);
  });
});
