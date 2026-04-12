import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestId } from '@/lib/server/request-context';

export type HealthDeps = {
  pingDatabase: () => Promise<void>;
  now: () => Date;
  uptimeSeconds: () => number;
};

const defaultDeps: HealthDeps = {
  pingDatabase: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  now: () => new Date(),
  uptimeSeconds: () => Math.round(process.uptime())
};

export async function handleHealthGet(request: Request, deps: HealthDeps = defaultDeps) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();

  try {
    await deps.pingDatabase();

    const response = NextResponse.json({
      status: 'ok',
      requestId,
      timestamp: deps.now().toISOString(),
      uptimeSeconds: deps.uptimeSeconds(),
      responseTimeMs: Date.now() - startedAt,
      checks: {
        database: 'ok',
        encryptionKeyConfigured: Boolean(process.env.APP_ENCRYPTION_KEY || process.env.AUTH_SECRET),
        smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        vapidConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        weeklyJobConfigured: Boolean(process.env.CALMA_WEEKLY_TOKEN)
      }
    });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        status: 'degraded',
        requestId,
        timestamp: deps.now().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        checks: {
          database: 'error',
          encryptionKeyConfigured: Boolean(process.env.APP_ENCRYPTION_KEY || process.env.AUTH_SECRET)
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
    response.headers.set('x-request-id', requestId);
    return response;
  }
}
