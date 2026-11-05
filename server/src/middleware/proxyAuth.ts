import crypto from 'node:crypto';
import { Request } from 'express';
import { db } from '../db/database.js';
import { env } from '../config/env.js';
import { AuthenticatedUser } from './auth.js';
import { logger } from '../utils/logger.js';

export function isProxyAuthEnabled(): boolean {
  if (process.env.TRUST_PROXY_HEADERS === 'false' || process.env.ENABLE_PROXY_AUTH === 'false') {
    return false;
  }
  if (process.env.TRUST_PROXY_HEADERS === 'true' || process.env.ENABLE_PROXY_AUTH === 'true' || env.TRUST_PROXY_HEADERS) {
    return true;
  }
  try {
    const row = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['enable_proxy_auth']);
    if (row) return row.value === 'true';
  } catch (err: any) {
    console.error('[AUTH] Error checking enable_proxy_auth setting:', err?.message);
  }
  return false;
}

export function isTrustedProxy(req: Request): boolean {
  const remoteIp = (req.socket?.remoteAddress || req.ip || '').replace(/^.*:/, '').toLowerCase();
  const fullRemote = (req.socket?.remoteAddress || '').toLowerCase();

  // Always trust loopback
  if (remoteIp === '127.0.0.1' || fullRemote === '::1' || remoteIp === 'localhost') {
    return true;
  }

  // Check configured trusted proxies list or wildcard
  for (const trusted of env.TRUSTED_PROXIES) {
    if (trusted === '*' || trusted === remoteIp || fullRemote === trusted) {
      return true;
    }
  }

  // RFC 1918 & RFC 6598 Subnet checks (standard private & CGNAT networks)
  if (remoteIp.startsWith('10.')) return true;
  if (remoteIp.startsWith('192.168.')) return true;
  if (remoteIp.startsWith('172.')) {
    const secondOctet = parseInt(remoteIp.split('.')[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  // Carrier Grade NAT (WireGuard / Tailscale / Pangolin Gerbil tunnel: 100.64.0.0/10)
  if (remoteIp.startsWith('100.')) {
    const secondOctet = parseInt(remoteIp.split('.')[1], 10);
    if (secondOctet >= 64 && secondOctet <= 127) return true;
  }

  return false;
}

export function getProxyUser(req: Request): AuthenticatedUser | null {
  if (!isProxyAuthEnabled()) {
    return null;
  }

  if (!isTrustedProxy(req)) {
    logger.warn({ ip: req.socket?.remoteAddress || req.ip }, 'Ignored untrusted proxy auth headers');
    return null;
  }

  // Check for reverse proxy authentication headers (Pangolin, Authelia, Authentik, Traefik, Cloudflare Access)
  const proxyUserHeader = (
    req.headers['remote-email'] ||
    req.headers['remote-user'] ||
    req.headers['x-forwarded-email'] ||
    req.headers['x-forwarded-user'] ||
    req.headers['x-pangolin-user'] ||
    req.headers['x-authentik-email'] ||
    req.headers['x-authentik-username']
  ) as string | undefined;

  if (!proxyUserHeader || typeof proxyUserHeader !== 'string' || proxyUserHeader.trim().length === 0) {
    return null;
  }

  const cleanIdentity = proxyUserHeader.trim().toLowerCase();
  let user = db.get<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE email = ?',
    [cleanIdentity]
  );

  // If header is a username without domain, match by username prefix (e.g. rob -> rob@romanas.nl)
  if (!user && !cleanIdentity.includes('@')) {
    user = db.get<{ id: string; email: string; role: string }>(
      'SELECT id, email, role FROM users WHERE email LIKE ? ORDER BY CASE WHEN role = "admin" THEN 0 ELSE 1 END LIMIT 1',
      [`${cleanIdentity}@%`]
    );
  }

  if (!user) {
    if (!env.ALLOW_PROXY_REGISTRATION) {
      logger.warn({ cleanIdentity }, 'Proxy registration rejected (registration disabled)');
      return null;
    }

    const userCount = db.get<{ count: number }>('SELECT count(*) as count FROM users')?.count || 0;
    const role = userCount === 0 ? 'admin' : 'driver';
    const newUserId = crypto.randomUUID();
    const now = new Date().toISOString();
    const finalEmail = cleanIdentity.includes('@') ? cleanIdentity : `${cleanIdentity}@vault.local`;

    db.run(
      'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, finalEmail, 'proxy_auth_placeholder', role, now, now]
    );
    user = { id: newUserId, email: finalEmail, role };
    logger.info({ email: finalEmail, role }, 'Auto-provisioned proxy user');
  } else {
    try {
      const now = new Date().toISOString();
      db.run('UPDATE users SET last_login_at = ?, last_active_at = ? WHERE id = ?', [now, now, user.id]);
    } catch {}
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    isApiKey: false,
  };
}

