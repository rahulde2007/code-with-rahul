import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cache Supabase admin client instance across warm serverless invocations
let cachedClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase admin credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.');
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

// In-memory IP rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function isRateLimited(ip: string, limit = 60, windowMs = 60 * 1000): boolean {
  const now = Date.now();

  // Prune map if large
  if (rateLimitMap.size > 5000) {
    for (const [key, entry] of Array.from(rateLimitMap.entries())) {
      if (entry.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return rawIp.trim();
  }
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

export async function parseRequestBody(req: any): Promise<Record<string, any>> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  // If req is a stream (e.g. Node IncomingMessage in Vite dev server)
  return new Promise((resolve) => {
    let data = '';
    req.on?.('data', (chunk: any) => {
      data += chunk;
    });
    req.on?.('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.('error', () => resolve({}));
  });
}

export function parseRequestQuery(req: any): Record<string, string> {
  if (req.query && typeof req.query === 'object') {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') result[k] = v;
      else if (Array.isArray(v) && typeof v[0] === 'string') result[k] = v[0];
    }
    return result;
  }
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const result: Record<string, string> = {};
      for (const [k, v] of Array.from(url.searchParams.entries())) {
        result[k] = v;
      }
      return result;
    } catch {
      return {};
    }
  }
  return {};
}
