import {
  getAdminSupabase,
  getClientIp,
  isRateLimited,
  parseRequestBody,
} from './_utils.js';

interface ApiRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

// RFC 5322 compliant regex check for practical email formats
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getClientIp(req);

  // Rate limiting check: 5 requests per minute per IP for subscribe endpoint
  if (isRateLimited(`subscribe:${ip}`, 5, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many subscription attempts. Please try again in a minute.',
    });
  }

  const body = await parseRequestBody(req);

  // Honeypot check: bot prevention
  if (typeof body?._gotcha === 'string' && body._gotcha.trim().length > 0) {
    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully! Thank you for joining.',
    });
  }

  const emailRaw = typeof body?.email === 'string' ? body.email.trim() : '';
  const email = emailRaw.toLowerCase();

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in subscribe API:', err.message);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  try {
    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      // Code 23505 is PostgreSQL unique constraint violation ("subscribers_email_key")
      if (error.code === '23505') {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to the newsletter!',
          alreadySubscribed: true,
        });
      }

      console.error('Error inserting into subscribers table:', error);
      return res.status(500).json({
        error: 'Failed to subscribe. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully! Thank you for joining.',
      alreadySubscribed: false,
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/subscribe:', err);
    return res.status(500).json({
      error: 'Internal server error. Please try again later.',
    });
  }
}
