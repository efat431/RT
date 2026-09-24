import { handleApiRequest } from '../../src/server/router';
import { Env } from '../../src/server/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { route: string[] };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleApiRequest(context.request, context.env);
}
