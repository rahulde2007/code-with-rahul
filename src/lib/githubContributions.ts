import { GITHUB_USERNAME } from '../constants/github.js';

const LAST_SELECTABLE_YEAR = 2029;

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  days: ContributionDay[];
  from: string;
  to: string;
}

const parseContributionPage = (html: string): ContributionDay[] => {
  const tooltips = new Map<string, string>();
  const tooltipPattern = /<tool-tip\b(?=[^>]*\bfor="([^"]+)")[^>]*>([\s\S]*?)<\/tool-tip>/g;

  for (const match of html.matchAll(tooltipPattern)) {
    tooltips.set(match[1], match[2].replace(/<[^>]*>/g, '').trim());
  }

  const days: ContributionDay[] = [];
  const cellPattern =
    /<td\b(?=[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})")(?=[^>]*\bid="([^"]+)")[^>]*>/g;

  for (const match of html.matchAll(cellPattern)) {
    const [, date, id] = match;
    const tooltip = tooltips.get(id);
    if (!tooltip) {
      throw new Error(`GitHub contribution tooltip missing for ${date}`);
    }

    const emptyDay = /^No contributions on\b/i.test(tooltip);
    const countMatch = tooltip.match(/^([\d,]+)\s+contributions?\s+on\b/i);
    if (!emptyDay && !countMatch) {
      throw new Error(`GitHub contribution count could not be parsed for ${date}`);
    }

    days.push({
      date,
      contributionCount: countMatch ? Number(countMatch[1].replace(/,/g, '')) : 0,
    });
  }

  if (days.length < 365) {
    throw new Error(`GitHub returned an incomplete contribution calendar (${days.length} days)`);
  }

  return days;
};

const fetchYear = async (year: number): Promise<ContributionDay[]> => {
  const url = new URL(`https://github.com/users/${GITHUB_USERNAME}/contributions`);
  url.searchParams.set('from', `${year}-01-01`);
  url.searchParams.set('to', `${year}-12-31`);

  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) {
    throw new Error(`GitHub contribution page returned HTTP ${response.status}`);
  }

  return parseContributionPage(await response.text());
};

const utcDateString = (date: Date): string => date.toISOString().slice(0, 10);

const fillCalendarDates = (
  days: ContributionDay[],
  from: string,
  to: string,
): ContributionDay[] => {
  const contributionsByDate = new Map(days.map((day) => [day.date, day.contributionCount]));
  const completeDays: ContributionDay[] = [];
  const date = new Date(`${from}T00:00:00Z`);
  const lastDate = new Date(`${to}T00:00:00Z`);

  for (; date <= lastDate; date.setUTCDate(date.getUTCDate() + 1)) {
    const currentDate = utcDateString(date);
    completeDays.push({
      date: currentDate,
      contributionCount: contributionsByDate.get(currentDate) ?? 0,
    });
  }

  return completeDays;
};

export const isSupportedContributionYear = (year: string): boolean => {
  if (!/^\d{4}$/.test(year)) return false;
  const numericYear = Number(year);
  return numericYear >= 2008 && numericYear <= LAST_SELECTABLE_YEAR;
};

export const getContributionCalendar = async (
  selectedYear: string,
  now = new Date(),
): Promise<ContributionCalendar> => {
  const currentYear = now.getUTCFullYear();
  let from: string;
  let to: string;
  let days: ContributionDay[];

  if (selectedYear === 'Default') {
    const start = new Date(Date.UTC(currentYear, now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 364);
    from = utcDateString(start);
    to = utcDateString(now);

    const firstYear = Number(from.slice(0, 4));
    const calendarYears = [...new Set([firstYear, currentYear])];
    const calendars = await Promise.all(calendarYears.map(fetchYear));
    const allDays = calendars.flat();
    days = allDays.filter((day) => day.date >= from && day.date <= to);
  } else {
    const year = Number(selectedYear);
    if (!isSupportedContributionYear(selectedYear)) {
      throw new Error('Invalid contribution year');
    }
    from = `${year}-01-01`;
    to = year === currentYear ? utcDateString(now) : `${year}-12-31`;
    days = (await fetchYear(year)).filter((day) => day.date >= from && day.date <= to);
  }

  if (days.length === 0 && selectedYear === 'Default') {
    throw new Error('GitHub returned no contribution days for the requested period');
  }

  days.sort((left, right) => left.date.localeCompare(right.date));
  days = fillCalendarDates(days, from, to);

  return {
    totalContributions: days.reduce((total, day) => total + day.contributionCount, 0),
    days,
    from,
    to,
  };
};
