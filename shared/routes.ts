import { z } from 'zod';
import { insertModuleSchema, insertVideoSchema, insertFeedbackSchema, insertAgreementSchema, insertAnnouncementSchema, modules, videos, userProgress, videoFeedback, agreements, subscriptions, announcements } from './schema';
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
        approvalStatus: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
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
    },
    suspend: {
      method: 'POST' as const,
      path: '/api/users/:id/suspend' as const,
      input: z.object({ reason: z.string().optional() }),
      responses: { 200: z.custom<typeof users.$inferSelect>() }
    },
    approve: {
      method: 'POST' as const,
      path: '/api/users/:id/approve' as const,
      input: z.object({}),
      responses: { 200: z.custom<typeof users.$inferSelect>() }
    },
    getAthletes: {
      method: 'GET' as const,
      path: '/api/users/athletes' as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
    },
    agreements: {
      method: 'GET' as const,
      path: '/api/users/:id/agreements' as const,
      responses: { 200: z.array(z.custom<typeof agreements.$inferSelect>()) }
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
    },
    update: {
      method: 'PUT' as const,
      path: '/api/modules/:id' as const,
      input: insertModuleSchema.partial(),
      responses: { 200: z.custom<typeof modules.$inferSelect>() }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/modules/:id' as const,
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  progress: {
    list: {
      method: 'GET' as const,
      path: '/api/progress' as const,
      responses: { 200: z.array(z.custom<typeof userProgress.$inferSelect>()) }
    },
    listForUser: {
      method: 'GET' as const,
      path: '/api/progress/:userId' as const,
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
  },
  subscriptions: {
    get: {
      method: 'GET' as const,
      path: '/api/subscriptions/me' as const,
      responses: { 200: z.custom<typeof subscriptions.$inferSelect>().nullable() }
    },
    createCheckout: {
      method: 'POST' as const,
      path: '/api/subscriptions/checkout' as const,
      input: z.object({ tier: z.enum(['tier1', 'tier2', 'tier3']) }),
      responses: { 200: z.object({ url: z.string() }) }
    },
    createPortal: {
      method: 'POST' as const,
      path: '/api/subscriptions/portal' as const,
      input: z.object({}),
      responses: { 200: z.object({ url: z.string() }) }
    },
    cancel: {
      method: 'POST' as const,
      path: '/api/subscriptions/cancel' as const,
      input: z.object({}),
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/announcements' as const,
      responses: { 200: z.array(z.custom<typeof announcements.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/announcements' as const,
      input: insertAnnouncementSchema,
      responses: { 201: z.custom<typeof announcements.$inferSelect>() }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/announcements/:id' as const,
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  parentConsent: {
    send: {
      method: 'POST' as const,
      path: '/api/parent-consent/send' as const,
      input: z.object({ parentEmail: z.string().email() }),
      responses: { 200: z.object({ success: z.boolean() }) }
    },
    approve: {
      method: 'GET' as const,
      path: '/api/parent-consent/approve' as const,
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  admin: {
    metrics: {
      method: 'GET' as const,
      path: '/api/admin/metrics' as const,
      responses: {
        200: z.object({
          totalUsers: z.number(),
          activeAthletes: z.number(),
          pendingApprovals: z.number(),
          suspendedUsers: z.number(),
          tierBreakdown: z.object({ none: z.number(), tier1: z.number(), tier2: z.number(), tier3: z.number() }),
          totalVideos: z.number(),
          pendingVideos: z.number(),
          totalModules: z.number(),
        })
      }
    }
  },
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
