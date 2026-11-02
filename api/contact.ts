import { getClientIp, isRateLimited, parseRequestBody } from './_utils.js';

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`contact:${ip}`, 5, 60 * 1000)) {
    return res.status(429).json({ error: 'Too many contact attempts. Please try again in a minute.' });
  }

  const body = await parseRequestBody(req);
  if (typeof body?._gotcha === 'string' && body._gotcha.trim().length > 0) {
    return res.status(200).json({ success: true });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or fewer.' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message must be 2000 characters or fewer.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey || !notifyEmail) {
    if (!apiKey) console.error('RESEND_API_KEY');
    if (!notifyEmail) console.error('NOTIFY_EMAIL');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const hostHeader = req.headers?.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] ?? '' : hostHeader ?? '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return res.status(200).json({ success: true });
  }

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio <onboarding@resend.dev>',
        to: [notifyEmail],
        reply_to: email,
        subject: subject ? `Contact: ${subject}` : `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });
  } catch {
    console.error('Resend request failed.');
    return res.status(502).json({ error: 'Failed to send message.' });
  }

  if (!response.ok) {
    console.error(response.status);
    return res.status(502).json({ error: 'Failed to send message.' });
  }

  return res.status(200).json({ success: true });
}
