import crypto from 'node:crypto';
import { Request } from 'express';
import { db } from '../db/database.js';
import { env } from '../config/env.js';
import { AuthenticatedUser } from './auth.js';
import { logger } from '../utils/logger.js';

export function isProxyAuthEnabled(): boolean {
  // 1. The database setting set via Admin UI takes top precedence!
  try {
    const row = db.get<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['enable_proxy_auth']);
    if (row && (row.value === 'true' || row.value === 'false')) {
      return row.value === 'true';
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Error checking enable_proxy_auth setting');
  }

  // 2. Fall back to environment variable configuration
  if (process.env.TRUST_PROXY_HEADERS === 'false' || process.env.ENABLE_PROXY_AUTH === 'false') {
    return false;
  }
  if (process.env.TRUST_PROXY_HEADERS === 'true' || process.env.ENABLE_PROXY_AUTH === 'true' || env.TRUST_PROXY_HEADERS) {
    return true;
  }
  return false;
}

export function isTrustedProxy(req: Request): boolean {
  // If explicitly configured to trust all proxies via env wildcard
  for (const trusted of env.TRUSTED_PROXIES) {
    if (trusted === '*') return true;
  }

  const rawSocket = req.socket?.remoteAddress || '';
  const rawIp = req.ip || '';

  // Normalize IP: strip IPv4-mapped IPv6 prefix (::ffff:192.168.1.1 -> 192.168.1.1)
  const cleanSocket = rawSocket.replace(/^::ffff:/i, '').trim().toLowerCase();
  const cleanIp = rawIp.replace(/^::ffff:/i, '').trim().toLowerCase();

  const isTrustedIpString = (ip: string): boolean => {
    if (!ip) return false;
    // Loopback
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    // Private IPv4 (RFC 1918)
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;
    if (ip.startsWith('172.')) {
      const parts = ip.split('.');
      if (parts.length >= 2) {
        const second = parseInt(parts[1], 10);
        if (second >= 16 && second <= 31) return true;
      }
    }
    // CGNAT & Carrier subnets (WireGuard, Tailscale, Pangolin Gerbil tunnel: 100.64.0.0/10)
    if (ip.startsWith('100.')) {
      const parts = ip.split('.');
      if (parts.length >= 2) {
        const second = parseInt(parts[1], 10);
        if (second >= 64 && second <= 127) return true;
      }
    }
    // Link-local IPv4
    if (ip.startsWith('169.254.')) return true;
    // Private IPv6 (Unique Local fc00::/7, Link-Local fe80::/10)
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;

    // Check configured TRUSTED_PROXIES list
    for (const trusted of env.TRUSTED_PROXIES) {
      if (trusted === '*' || trusted === ip) return true;
    }
    return false;
  };

  return isTrustedIpString(cleanSocket) || isTrustedIpString(cleanIp);
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
  // Check email headers first because in VehicleVault users are identified primarily by email
  const proxyEmail = (
    req.headers['remote-email'] ||
    req.headers['x-forwarded-email'] ||
    req.headers['x-remote-email'] ||
    req.headers['x-pangolin-email'] ||
    req.headers['x-authentik-email'] ||
    req.headers['x-auth-request-email'] ||
    req.headers['x-auth-email']
  ) as string | undefined;

  const proxyUsername = (
    req.headers['remote-user'] ||
    req.headers['x-forwarded-user'] ||
    req.headers['x-remote-user'] ||
    req.headers['x-pangolin-user'] ||
    req.headers['x-authentik-username'] ||
    req.headers['x-auth-request-user'] ||
    req.headers['x-authelia-user']
  ) as string | undefined;

  const identityHeader = (proxyEmail || proxyUsername || '').trim();
  if (!identityHeader) {
    return null;
  }

  const cleanIdentity = identityHeader.toLowerCase();

  // 1. Match by exact email
  let user = db.get<{ id: string; email: string; role: string }>(
    'SELECT id, email, role FROM users WHERE LOWER(email) = ?',
    [cleanIdentity]
  );

  // 2. If no match and identity is username (no @), match prefix (e.g. rob -> rob@romanas.nl)
  if (!user && !cleanIdentity.includes('@')) {
    user = db.get<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM users WHERE LOWER(email) LIKE ? ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END LIMIT 1",
      [`${cleanIdentity}@%`]
    );
  }

  // 3. If still no match and secondary header exists, try matching the secondary header
  if (!user && proxyEmail && proxyUsername && proxyUsername !== proxyEmail) {
    const cleanUser = proxyUsername.trim().toLowerCase();
    user = db.get<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM users WHERE LOWER(email) = ? OR LOWER(email) LIKE ? ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END LIMIT 1",
      [cleanUser, `${cleanUser}@%`]
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
