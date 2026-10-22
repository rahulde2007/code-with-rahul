import { getMetaForPath, toAbsoluteUrl } from '../og-meta.config';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    let path = url.searchParams.get('path') || '/';
    if (!path.startsWith('/')) path = '/' + path;
    const origin = url.origin;
    const meta = getMetaForPath(path);

    const baseUrl = `${origin}/index.html`;
    const htmlResponse = await fetch(baseUrl);
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch base index.html: ${htmlResponse.status}`);
    }
    let html = await htmlResponse.text();

    const cacheHeaders = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    };

    if (!meta) {
      return new Response(html, {
        status: 200,
        headers: cacheHeaders,
      });
    }

    const fullUrl = toAbsoluteUrl(path.startsWith('/') ? path : '/' + path);
    const imageUrl = toAbsoluteUrl(meta.image);

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const replacements: Array<[RegExp, string]> = [
      [/<title>.*?<\/title>/s, `<title>${escape(meta.title)}</title>`],
      [/<link\s+rel="canonical"\s+href="[^"]*"/is, `<link rel="canonical" href="${escape(fullUrl)}"`],
      [/<meta\s+name="description"\s+content="[^"]*"/is, `<meta name="description" content="${escape(meta.description)}"`],
      [/<meta\s+property="og:title"\s+content="[^"]*"/is, `<meta property="og:title" content="${escape(meta.title)}"`],
      [/<meta\s+property="og:description"\s+content="[^"]*"/is, `<meta property="og:description" content="${escape(meta.description)}"`],
      [/<meta\s+property="og:url"\s+content="[^"]*"/is, `<meta property="og:url" content="${escape(fullUrl)}"`],
      [/<meta\s+property="og:image"\s+content="[^"]*"/is, `<meta property="og:image" content="${escape(imageUrl)}"`],
      [/<meta\s+name="twitter:title"\s+content="[^"]*"/is, `<meta name="twitter:title" content="${escape(meta.title)}"`],
      [/<meta\s+name="twitter:description"\s+content="[^"]*"/is, `<meta name="twitter:description" content="${escape(meta.description)}"`],
      [/<meta\s+name="twitter:image"\s+content="[^"]*"/is, `<meta name="twitter:image" content="${escape(imageUrl)}"`],
    ];

    for (const [regex, repl] of replacements) html = html.replace(regex, repl);

    return new Response(html, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (err) {
    console.error('OG API error:', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
