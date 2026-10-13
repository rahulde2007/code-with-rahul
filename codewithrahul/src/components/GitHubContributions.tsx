import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useInView } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import ScrollReveal from './ui/ScrollReveal';
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../constants/github';
import type { ContributionCalendar, ContributionDay } from '../lib/githubContributions';

type CalendarDay = ContributionDay | null;
type TooltipState = {
  x: number;
  y: number;
  below: boolean;
  text: string;
};

interface ApiCalendar extends ContributionCalendar {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseCalendar = (value: unknown): ApiCalendar | null => {
  if (
    !isRecord(value) ||
    typeof value.totalContributions !== 'number' ||
    !Array.isArray(value.days) ||
    typeof value.from !== 'string' ||
    typeof value.to !== 'string'
  ) {
    return null;
  }

  const days: ContributionDay[] = [];
  for (const day of value.days) {
    if (
      !isRecord(day) ||
      typeof day.date !== 'string' ||
      typeof day.contributionCount !== 'number'
    ) {
      return null;
    }
    days.push({ date: day.date, contributionCount: day.contributionCount });
  }

  if (days.length === 0) return null;
  return {
    totalContributions: value.totalContributions,
    days,
    from: value.from,
    to: value.to,
  };
};

const createWeeks = (days: ContributionDay[]): CalendarDay[][] => {
  const firstDate = new Date(`${days[0].date}T00:00:00Z`);
  const currentWeek: CalendarDay[] = Array.from(
    { length: firstDate.getUTCDay() },
    () => null,
  );
  const weeks: CalendarDay[][] = [];

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek.length = 0;
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return weeks;
};

const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en', options).format(new Date(`${date}T00:00:00Z`));

const GitHubContributions = () => {
  const [calendar, setCalendar] = useState<ApiCalendar | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'Default'>('Default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isGridInView = useInView(gridRef, { once: true, margin: '-50px' });

  useEffect(() => {
    const controller = new AbortController();

    const fetchCalendar = async () => {
      setIsLoading(true);
      setError(null);
      setTooltip(null);

      try {
        const response = await fetch(`/api/github?year=${selectedYear}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`GitHub contribution request failed (${response.status})`);
        }

        const payload: unknown = await response.json();
        const result = parseCalendar(payload);
        if (!result) throw new Error('GitHub returned an invalid contribution calendar');
        setCalendar(result);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error('GitHub contribution calendar request failed:', requestError);
        setCalendar(null);
        setError('GitHub activity is temporarily unavailable. Please try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchCalendar();
    return () => controller.abort();
  }, [selectedYear, retryCount]);

  const weeks = useMemo(
    () => (calendar ? createWeeks(calendar.days) : []),
    [calendar],
  );
  const years = [2029, 2028, 2027, 2026];

  const monthLabels = useMemo(() => {
    const labels = new Map<number, string>();
    let previousMonth = -1;

    weeks.forEach((week, index) => {
      const firstDay = week.find((day): day is ContributionDay => day !== null);
      if (!firstDay) return;

      const date = new Date(`${firstDay.date}T00:00:00Z`);
      const month = date.getUTCMonth();
      if (month !== previousMonth) {
        labels.set(index, date.toLocaleString('en', { month: 'short', timeZone: 'UTC' }));
        previousMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  const getContributionColor = (count: number) => {
    if (count === 0) return 'bg-muted/80';
    if (count <= 2) return 'bg-[#00DC82]/20';
    if (count <= 5) return 'bg-[#00DC82]/50';
    if (count <= 8) return 'bg-[#00DC82]/80';
    return 'bg-[#00DC82]';
  };

  const showTooltip = (event: MouseEvent<HTMLDivElement>, day: ContributionDay) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const below = rect.top < 54;
    const tooltipWidth = Math.min(300, window.innerWidth - 24);
    setTooltip({
      x: Math.min(
        Math.max(rect.left + rect.width / 2, tooltipWidth / 2 + 12),
        window.innerWidth - tooltipWidth / 2 - 12,
      ),
      y: below ? rect.bottom + 8 : rect.top - 8,
      below,
      text: `${formatDate(day.date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} · ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`,
    });
  };

  const playClickSound = () => {
    const audio = new Audio('/Audio/mouse-click.mp3');
    audio.volume = 0.2;
    audio.play().catch((audioError) => {
      console.debug('Contribution year selector audio was unavailable:', audioError);
    });
  };

  return (
    <>
      <section id="contributions" className="pt-4 pb-8 bg-background">
        <div className="max-w-3xl mx-auto w-full px-6">
          <ScrollReveal className="mb-6">
            <h4 className="text-2xl md:text-2xl font-extrabold text-foreground text-left font-hanken">
              GitHub Activity
            </h4>
            <p className="text-left mt-2 text-sm font-hanken text-muted-foreground">
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {GITHUB_USERNAME}
              </a>
              's coding journey over the past year
            </p>
          </ScrollReveal>

          <ScrollReveal className="w-full mt-8" delay={0.15}>
            <div className="w-full border border-border bg-card rounded-lg p-4 sm:py-4 sm:px-6 shadow-lg">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-hanken text-muted-foreground">
                  {selectedYear === 'Default'
                    ? 'Total contributions'
                    : `Total contributions in ${selectedYear}`}
                  {calendar && (
                    <>
                      {' '}from {formatDate(calendar.from, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                      {' '}– {formatDate(calendar.to, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                    </>
                  )}
                  :{' '}
                  <span
                    className={`text-[#00DC82] font-medium transition-all duration-300 ${
                      isLoading
                        ? 'animate-shimmer bg-gradient-to-r from-[#00DC82]/20 via-[#00DC82]/60 to-[#00DC82]/20 bg-[length:200%_100%] rounded px-2'
                        : ''
                    }`}
                  >
                    {isLoading ? 'Loading...' : calendar?.totalContributions ?? '—'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 font-hanken select-none items-center">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={selectedYear === year}
                      onClick={() => {
                        if (selectedYear === year) {
                          setSelectedYear('Default');
                        } else {
                          setSelectedYear(year);
                        }
                        playClickSound();
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                        selectedYear === year
                          ? 'bg-foreground text-background shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-border px-4 py-6 text-center font-hanken text-sm text-muted-foreground"
                >
                  <p>{error}</p>
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Github size={16} aria-hidden="true" />
                    View GitHub profile
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setRetryCount((count) => count + 1)}
                    className="ml-2 mt-3 rounded-full border border-border px-4 py-1.5 font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto thin-scrollbar pb-2">
                  <div
                    className="min-w-max"
                    aria-busy={isLoading}
                    aria-label={`${calendar?.totalContributions ?? 0} contributions from ${calendar?.from ?? ''} to ${calendar?.to ?? ''}`}
                  >
                    <div className="ml-[32px] sm:ml-[36px] mb-1 flex gap-[2px] text-[11px] sm:text-xs font-hanken text-muted-foreground/70">
                      {isLoading
                        ? Array.from({ length: 53 }, (_, index) => (
                            <span key={index} className="w-[8px] sm:w-[9px]" />
                          ))
                        : weeks.map((_, index) => (
                            <span
                              key={index}
                              className="w-[8px] sm:w-[9px] overflow-visible whitespace-nowrap"
                            >
                              {monthLabels.get(index) ?? ''}
                            </span>
                          ))}
                    </div>

                    <div className="flex">
                      <div className="mr-2 flex w-[24px] shrink-0 flex-col justify-between text-[10px] sm:w-[28px] sm:text-[11px] font-hanken text-muted-foreground/70">
                        {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, index) => (
                          <span key={index} className="flex h-[8px] items-center sm:h-[9px]">
                            {label}
                          </span>
                        ))}
                      </div>

                      <div ref={gridRef} className="inline-flex gap-[2px]">
                        {isLoading
                          ? Array.from({ length: 53 }, (_, weekIndex) => (
                              <div key={weekIndex} className="flex flex-col gap-[2px]">
                                {Array.from({ length: 7 }, (_, dayIndex) => (
                                  <span
                                    key={dayIndex}
                                    className="h-[8px] w-[8px] animate-pulse rounded-sm bg-muted sm:h-[9px] sm:w-[9px]"
                                  />
                                ))}
                              </div>
                            ))
                          : weeks.map((week, weekIndex) => (
                              <div key={weekIndex} className="flex flex-col gap-[2px]">
                                {week.map((day, dayIndex) =>
                                  day ? (
                                    <div
                                      key={day.date}
                                      role="img"
                                      aria-label={`${formatDate(day.date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}: ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`}
                                      title={`${formatDate(day.date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} · ${day.contributionCount} contribution${day.contributionCount === 1 ? '' : 's'}`}
                                      className={`h-[8px] w-[8px] rounded-sm transition-all duration-300 hover:ring-2 hover:ring-[#00DC82]/40 sm:h-[9px] sm:w-[9px] ${
                                        getContributionColor(day.contributionCount)
                                      } ${isGridInView ? 'animate-fade-in' : 'opacity-0'}`}
                                      style={{
                                        animationDelay: `${(weekIndex * 7 + dayIndex) * 12}ms`,
                                        animationFillMode: 'both',
                                      }}
                                      onMouseEnter={(event) => showTooltip(event, day)}
                                      onMouseLeave={() => setTooltip(null)}
                                    />
                                  ) : (
                                    <span
                                      key={`empty-${weekIndex}-${dayIndex}`}
                                      aria-hidden="true"
                                      className="h-[8px] w-[8px] sm:h-[9px] sm:w-[9px]"
                                    />
                                  ),
                                )}
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!error && (
                <div className="mt-3 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-hanken">Less</span>
                    <div className="flex gap-1" aria-hidden="true">
                      <span className="h-3 w-3 rounded-sm bg-muted/80" />
                      <span className="h-3 w-3 rounded-sm bg-[#00DC82]/20" />
                      <span className="h-3 w-3 rounded-sm bg-[#00DC82]/50" />
                      <span className="h-3 w-3 rounded-sm bg-[#00DC82]/80" />
                      <span className="h-3 w-3 rounded-sm bg-[#00DC82]" />
                    </div>
                    <span className="font-medium font-hanken">More</span>
                  </div>
                  {calendar?.totalContributions === 0 && !isLoading && (
                    <span className="font-hanken text-xs">No contributions in this period</span>
                  )}
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 font-hanken text-xs font-medium hover:text-foreground"
                  >
                    View profile
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {tooltip && (
        <div
          role="tooltip"
          className={`fixed z-[100] pointer-events-none -translate-x-1/2 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:text-black dark:bg-white rounded-md shadow-xl font-satoshi whitespace-nowrap ${
            tooltip.below ? '' : '-translate-y-full'
          }`}
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {tooltip.text}
          <span
            className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-900 dark:bg-white ${
              tooltip.below ? '-top-1' : '-bottom-1'
            }`}
          />
        </div>
      )}
    </>
  );
};

export default GitHubContributions;
