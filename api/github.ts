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
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const yearValue = req.query.year;
  const year = Array.isArray(yearValue) ? yearValue[0] : yearValue;
  const refreshValue = req.query.refresh;
  const forceRefresh = (Array.isArray(refreshValue) ? refreshValue[0] : refreshValue) === 'true';
  if (!year || (year !== 'Default' && !isSupportedContributionYear(year))) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'Invalid contribution period' });
  }

  try {
    const calendar = await getContributionCalendar(year);
    res.setHeader(
      'Cache-Control',
      forceRefresh
        ? 'no-store'
        : 'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    );
    return res.status(200).json(calendar);
  } catch (error) {
    console.error('GitHub contribution calendar request failed:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'GitHub contribution activity is unavailable' });
  }
}
