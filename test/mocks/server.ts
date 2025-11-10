import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { RequestHandler } from 'msw';

// Mock Supabase responses
export const server = setupServer(
  rest.post('*/rpc/increment_post_view', (req, res, ctx) => {
    return res(ctx.json(true));
  })
);