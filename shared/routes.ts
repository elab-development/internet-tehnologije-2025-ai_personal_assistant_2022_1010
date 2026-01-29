import { z } from 'zod';

export const api = {
  auth: {
    login: {
      method: 'POST',
      path: '/api/auth/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ access_token: z.string(), token_type: z.string(), user: z.any() }),
      },
    },
    register: {
      method: 'POST',
      path: '/api/auth/register',
      input: z.object({ username: z.string(), password: z.string(), email: z.string().optional() }),
      responses: {
        201: z.object({ id: z.number(), username: z.string() }),
      },
    },
  },
  documents: {
    list: {
      method: 'GET',
      path: '/api/documents',
      responses: {
        200: z.array(z.object({ id: z.number(), title: z.string(), filename: z.string(), createdAt: z.string() })),
      },
    },
    upload: {
      method: 'POST',
      path: '/api/upload',
      input: z.any(), // FormData
      responses: {
        201: z.object({ id: z.number(), filename: z.string() }),
      },
    },
  },
  chat: {
    query: {
      method: 'POST',
      path: '/api/query',
      input: z.object({ query: z.string() }),
      responses: {
        200: z.object({ answer: z.string(), sources: z.array(z.any()) }),
      },
    },
  },
};
