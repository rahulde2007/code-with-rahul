import {
  getContributionCalendar,
  isSupportedContributionYear,
} from '../src/lib/githubContributions.js';

interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const yearValue = req.query.year;
  const year = Array.isArray(yearValue) ? yearValue[0] : yearValue;
  if (!year || (year !== 'Default' && !isSupportedContributionYear(year))) {
    return res.status(400).json({ error: 'Invalid contribution period' });
  }

  try {
    const calendar = await getContributionCalendar(year);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(calendar);
  } catch (error) {
    console.error('GitHub contribution calendar request failed:', error);
    return res.status(502).json({ error: 'GitHub contribution activity is unavailable' });
  }
}
