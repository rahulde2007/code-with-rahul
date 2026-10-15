import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import {
  getContributionCalendar,
  isSupportedContributionYear,
} from './src/lib/githubContributions'
import sponsorsHandler from './api/sponsors'

const githubContributionsApi = (): Plugin => ({
  name: 'github-contributions-api',
  configureServer(server) {
    server.middlewares.use('/api/github', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const year = url.searchParams.get('year');
      const forceRefresh = url.searchParams.get('refresh') === 'true';
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');

      if (req.method !== 'GET') {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
      }
      if (!year || (year !== 'Default' && !isSupportedContributionYear(year))) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid contribution period' }));
        return;
      }

      try {
        const calendar = await getContributionCalendar(year);
        res.setHeader(
          'Cache-Control',
          forceRefresh
            ? 'no-store'
            : 'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
        );
        res.end(JSON.stringify(calendar));
      } catch (error) {
        console.error('GitHub contribution calendar request failed:', error);
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'GitHub contribution activity is unavailable' }));
      }
    });
  },
});

const sponsorsApi = (): Plugin => ({
  name: 'sponsors-api',
  configureServer(server) {
    server.middlewares.use('/api/sponsors', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      await sponsorsHandler(req, {
        status(code) {
          res.statusCode = code;
          return this;
        },
        setHeader(name, value) {
          res.setHeader(name, value);
        },
        json(body) {
          res.end(JSON.stringify(body));
        },
      });
    });
  },
});

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx() },
    react(),
    githubContributionsApi(),
    sponsorsApi(),
  ],
})
