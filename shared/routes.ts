import { z } from 'zod';
import { insertModuleSchema, insertVideoSchema, insertFeedbackSchema, insertAgreementSchema, modules, videos, userProgress, videoFeedback, agreements } from './schema';
import { users } from './models/auth';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() })
};

export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/users/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id' as const,
      input: z.object({
        role: z.string().optional(),
        tier: z.string().optional(),
        dateOfBirth: z.string().optional(),
        parentEmail: z.string().optional(),
        approvalStatus: z.string().optional()
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>())
      }
    }
  },
  modules: {
    list: {
      method: 'GET' as const,
      path: '/api/modules' as const,
      responses: { 200: z.array(z.custom<typeof modules.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/modules' as const,
      input: insertModuleSchema,
      responses: { 201: z.custom<typeof modules.$inferSelect>(), 400: errorSchemas.validation }
    }
  },
  progress: {
    list: {
      method: 'GET' as const,
      path: '/api/progress' as const,
      responses: { 200: z.array(z.custom<typeof userProgress.$inferSelect>()) }
    },
    complete: {
      method: 'POST' as const,
      path: '/api/progress' as const,
      input: z.object({ moduleId: z.number() }),
      responses: { 201: z.custom<typeof userProgress.$inferSelect>() }
    }
  },
  videos: {
    list: {
      method: 'GET' as const,
      path: '/api/videos' as const,
      responses: { 200: z.array(z.custom<typeof videos.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/videos' as const,
      input: insertVideoSchema,
      responses: { 201: z.custom<typeof videos.$inferSelect>(), 400: errorSchemas.validation }
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/videos/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: { 200: z.custom<typeof videos.$inferSelect>(), 404: errorSchemas.notFound }
    }
  },
  feedback: {
    create: {
      method: 'POST' as const,
      path: '/api/feedback' as const,
      input: insertFeedbackSchema,
      responses: { 201: z.custom<typeof videoFeedback.$inferSelect>(), 400: errorSchemas.validation }
    },
    list: {
      method: 'GET' as const,
      path: '/api/feedback/:videoId' as const,
      responses: { 200: z.array(z.custom<typeof videoFeedback.$inferSelect>()) }
    }
  },
  agreements: {
    create: {
      method: 'POST' as const,
      path: '/api/agreements' as const,
      input: z.object({ agreementType: z.string() }),
      responses: { 201: z.custom<typeof agreements.$inferSelect>() }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
