import {
  getAdminSupabase,
  getClientIp,
  isRateLimited,
  parseRequestBody,
  parseRequestQuery,
} from './_utils.js';

interface ApiRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

// RFC 5322 compliant regex check for practical email formats
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 1) {
    return `${local}***@${domain}`;
  }
  return `${local[0]}***@${domain}`;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  const ip = getClientIp(req);

  // Rate limiting check: 10 requests per minute per IP for subscribe endpoint
  if (isRateLimited(`subscribe:${ip}`, 10, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many subscription attempts. Please try again in a minute.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in subscribe API:', err?.message || err);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: Check if visitorId is already subscribed and return masked email
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const visitorId = query.visitorId?.trim();

    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Valid visitorId is required.' });
    }

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('email')
        .eq('visitor_id', visitorId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscriber in GET /api/subscribe:', error);
        return res.status(500).json({ error: 'Failed to check subscription status.' });
      }

      if (data?.email) {
        const masked = maskEmail(data.email);
        return res.status(200).json({
          subscribed: true,
          email: masked,
          maskedEmail: masked,
        });
      }

      return res.status(200).json({
        subscribed: false,
      });
    } catch (err: any) {
      console.error('Unexpected error in GET /api/subscribe:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  // Handle POST request: Subscribe new visitor with email and visitorId
  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      // Honeypot check: bot prevention
      if (typeof body?._gotcha === 'string' && body._gotcha.trim().length > 0) {
        return res.status(200).json({
          success: true,
          alreadySubscribed: false,
          message: 'Subscribed successfully! Thank you for joining.',
        });
      }

      const emailRaw = typeof body?.email === 'string' ? body.email.trim() : '';
      const email = emailRaw.toLowerCase();

      const rawVisitorId = body?.visitorId ?? (req as any).body?.visitorId;
      const visitorId = typeof rawVisitorId === 'string' ? rawVisitorId.trim() : '';

      if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          error: 'Please enter a valid email address.',
        });
      }

      if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
        return res.status(400).json({
          error: 'Valid visitorId is required.',
        });
      }

      // Check if this visitor is already subscribed
      const { data: existingVisitor, error: checkError } = await supabase
        .from('subscribers')
        .select('email')
        .eq('visitor_id', visitorId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing subscriber in POST /api/subscribe:', checkError);
        return res.status(500).json({ error: 'Database service error.' });
      }

      if (existingVisitor) {
        return res.status(200).json({
          success: true,
          alreadySubscribed: true,
          message: 'এই device থেকে আগেই subscribe করা হয়েছে!',
        });
      }

      // Insert new subscriber with visitor_id
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({ email, visitor_id: visitorId });

      if (insertError) {
        // Code 23505: duplicate email or duplicate visitor_id
        if (insertError.code === '23505') {
          const isVisitorDup =
            insertError.message?.includes('subscribers_visitor_id_key') ||
            insertError.details?.includes('visitor_id');

          const msg = isVisitorDup
            ? 'এই device থেকে আগেই subscribe করা হয়েছে!'
            : 'এই email আগে থেকেই subscribed!';

          return res.status(200).json({
            success: true,
            alreadySubscribed: true,
            message: msg,
          });
        }

        console.error('Error inserting into subscribers table in POST /api/subscribe:', insertError);
        return res.status(500).json({
          error: 'Failed to subscribe. Please try again later.',
        });
      }

      return res.status(200).json({
        success: true,
        alreadySubscribed: false,
        message: 'Subscribed successfully! Thank you for joining.',
      });
    } catch (err: any) {
      console.error('Unexpected error in POST /api/subscribe:', err?.message || err);
      return res.status(500).json({
        error: 'Internal server error. Please try again later.',
      });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
