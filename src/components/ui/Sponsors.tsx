import { useEffect, useState } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface Sponsor {
  login: string;
  name: string;
  avatarUrl: string;
  url: string;
}

type SponsorState =
  | { status: 'loading' }
  | { status: 'loaded'; sponsors: Sponsor[] }
  | { status: 'error'; message: string; code?: string };

const Sponsors = () => {
  const [state, setState] = useState<SponsorState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    const loadSponsors = async () => {
      try {
        const response = await fetch('/api/sponsors', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          setState({
            status: 'error',
            code: typeof result.code === 'string' ? result.code : undefined,
            message:
              typeof result.error === 'string'
                ? result.error
                : 'Sponsor information is temporarily unavailable.',
          });
          return;
        }

        if (
          !Array.isArray(result.sponsors) ||
          !result.sponsors.every(
            (sponsor: unknown) =>
              typeof sponsor === 'object' &&
              sponsor !== null &&
              'login' in sponsor &&
              typeof sponsor.login === 'string' &&
              'name' in sponsor &&
              typeof sponsor.name === 'string' &&
              'avatarUrl' in sponsor &&
              typeof sponsor.avatarUrl === 'string' &&
              sponsor.avatarUrl.startsWith('https://avatars.githubusercontent.com/') &&
              'url' in sponsor &&
              typeof sponsor.url === 'string' &&
              sponsor.url.startsWith('https://github.com/')
          )
        ) {
          throw new Error('The sponsor service returned an invalid response.');
        }

        setState({ status: 'loaded', sponsors: result.sponsors });
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Sponsor information could not be loaded:', error);
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Sponsor information is temporarily unavailable.',
        });
      }
    };

    loadSponsors();
    return () => controller.abort();
  }, []);

  return (
    <section id="sponsors" className="pt-8 pb-8 bg-background">
      <div className="max-w-3xl mx-auto w-full px-6">
        <ScrollReveal className="mb-6">
          <h2 className="text-3xl font-bold text-foreground font-excon">
            Sponsors
          </h2>
        </ScrollReveal>

        {state.status === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            Loading verified sponsors…
          </div>
        )}

        {state.status === 'error' && (
          <div
            role="status"
            className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
          >
            {state.code === 'NOT_CONFIGURED' ? (
              <>
                <p className="text-center text-sm sm:text-base">
                  No sponsors yet — be the first to support my work!
                </p>
                <p className="mt-2 text-center text-xs">
                  Automatic sponsor listing is not configured yet.
                </p>
              </>
            ) : (
              <>Sponsor information is currently unavailable. {state.message}</>
            )}
          </div>
        )}

        {state.status === 'loaded' && state.sponsors.length === 0 && (
          <ScrollReveal>
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm sm:text-base text-muted-foreground shadow-sm">
              No sponsors yet — be the first to support my work!
            </div>
          </ScrollReveal>
        )}

        {state.status === 'loaded' && state.sponsors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.sponsors.map((sponsor, index) => (
              <ScrollReveal
                key={sponsor.login}
                delay={index * 0.15}
                className="h-full"
              >
                <a
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
                >
                  <img
                    src={sponsor.avatarUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold font-outfit text-foreground">
                      {sponsor.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      @{sponsor.login}
                    </span>
                  </span>
                  <Heart
                    aria-hidden="true"
                    className="ml-auto h-4 w-4 shrink-0 fill-rose-500 text-rose-500"
                  />
                </a>
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal className="mt-6 flex justify-center">
          <a
            href="https://github.com/rahulde2007/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium font-hanken text-foreground shadow-sm transition-all duration-200 hover:bg-accent"
          >
            Become a Sponsor
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Sponsors;
