import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import {
  getContributionCalendar,
  isSupportedContributionYear,
} from './src/lib/githubContributions'

const githubContributionsApi = (): Plugin => ({
  name: 'github-contributions-api',
  configureServer(server) {
    server.middlewares.use('/api/github', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const year = url.searchParams.get('year');
      res.setHeader('Content-Type', 'application/json');

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
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        res.end(JSON.stringify(calendar));
      } catch (error) {
        console.error('GitHub contribution calendar request failed:', error);
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'GitHub contribution activity is unavailable' }));
      }
    });
  },
});

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx() },
    react(),
    githubContributionsApi(),
  ],
})
