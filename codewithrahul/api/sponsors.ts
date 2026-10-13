interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

declare const process: {
  env: Record<string, string | undefined>;
};

interface SponsorNode {
  sponsorEntity:
    | {
        login: string;
        name: string | null;
        avatarUrl: string;
        url: string;
      }
    | null;
}

interface SponsorsPage {
  nodes: SponsorNode[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

const sponsorsQuery = `
  query PublicSponsors($login: String!, $after: String) {
    user(login: $login) {
      sponsorshipsAsMaintainer(
        first: 100
        after: $after
        includePrivate: false
        activeOnly: true
      ) {
        nodes {
          sponsorEntity {
            ... on User {
              login
              name
              avatarUrl
              url
            }
            ... on Organization {
              login
              name
              avatarUrl
              url
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token || token === 'your_github_personal_access_token_here') {
    return res.status(503).json({
      code: 'NOT_CONFIGURED',
      error:
        'Automatic sponsor fetching is not configured. Add a server-side GITHUB_TOKEN and enable GitHub Sponsors for rahulde2007.',
    });
  }

  try {
    const sponsors: NonNullable<SponsorNode['sponsorEntity']>[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    let pageCount = 0;

    while (hasNextPage && pageCount < 10) {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sponsorsQuery,
          variables: { login: 'rahulde2007', after: cursor },
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub Sponsors API returned HTTP ${response.status}`);
      }

      const result: {
        data?: {
          user?: { sponsorshipsAsMaintainer?: SponsorsPage } | null;
        };
        errors?: { message: string }[];
      } = await response.json();

      if (result.errors?.length) {
        throw new Error(
          `GitHub Sponsors API query failed: ${result.errors
            .map(({ message }) => message)
            .join('; ')}`
        );
      }

      const page = result.data?.user?.sponsorshipsAsMaintainer;
      if (!page) {
        throw new Error('GitHub returned no sponsor listing for rahulde2007.');
      }

      for (const { sponsorEntity } of page.nodes) {
        if (
          sponsorEntity &&
          typeof sponsorEntity.login === 'string' &&
          typeof sponsorEntity.avatarUrl === 'string' &&
          sponsorEntity.avatarUrl.startsWith('https://avatars.githubusercontent.com/') &&
          typeof sponsorEntity.url === 'string' &&
          sponsorEntity.url.startsWith('https://github.com/')
        ) {
          sponsors.push(sponsorEntity);
        }
      }

      hasNextPage = page.pageInfo.hasNextPage;
      cursor = page.pageInfo.endCursor;
      pageCount += 1;
    }

    if (hasNextPage) {
      throw new Error('GitHub returned more sponsors than the endpoint can safely load.');
    }

    res.setHeader(
      'Cache-Control',
      's-maxage=300, stale-while-revalidate=3600'
    );
    return res.status(200).json({
      sponsors: sponsors.map(({ login, name, avatarUrl, url }) => ({
        login,
        name: name?.trim() || login,
        avatarUrl,
        url,
      })),
    });
  } catch (error) {
    console.error('GitHub Sponsors request failed:', error);
    return res.status(502).json({
      error: 'Verified sponsor information is temporarily unavailable.',
    });
  }
}
