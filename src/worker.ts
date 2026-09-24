import { handleApiRequest } from './server/router';
import { Env } from './server/types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route API requests to the API router
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // Serve static frontend assets via Cloudflare Workers Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
