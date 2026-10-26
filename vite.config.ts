import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import {
  getContributionCalendar,
  isSupportedContributionYear,
} from './src/lib/githubContributions'
import sponsorsHandler from './api/sponsors'
import likesHandler from './api/likes'
import subscribeHandler from './api/subscribe'
import clapsHandler from './api/claps'
import photoLikesHandler from './api/photo-likes'

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

const createApiPlugin = (name: string, route: string, handler: any): Plugin => ({
  name,
  configureServer(server) {
    server.middlewares.use(route, async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      await handler(req, {
        status(code: number) {
          res.statusCode = code;
          return this;
        },
        setHeader(name: string, value: string) {
          res.setHeader(name, value);
        },
        json(body: unknown) {
          res.end(JSON.stringify(body));
        },
      });
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for local serverless handlers
  Object.assign(process.env, env);

  return {
    plugins: [
      { enforce: 'pre', ...mdx() },
      react(),
      githubContributionsApi(),
      createApiPlugin('sponsors-api', '/api/sponsors', sponsorsHandler),
      createApiPlugin('likes-api', '/api/likes', likesHandler),
      createApiPlugin('subscribe-api', '/api/subscribe', subscribeHandler),
      createApiPlugin('claps-api', '/api/claps', clapsHandler),
      createApiPlugin('photo-likes-api', '/api/photo-likes', photoLikesHandler),
    ],
  };
})

