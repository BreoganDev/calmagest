import { JobRunType, JobRunItemStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/services/adminService';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

function isForbidden(error: unknown) {
  return error instanceof Error && error.message === 'Forbidden';
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    await requireAdmin();
  } catch (error) {
    if (isForbidden(error)) {
      return jsonWithRequestId({ message: 'Forbidden' }, requestId, { status: 403 });
    }
    throw error;
  }

  const latestRun = await prisma.jobRun.findFirst({
    where: { type: JobRunType.WEEKLY_SUMMARY },
    orderBy: { startedAt: 'desc' },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        take: 25
      }
    }
  });

  if (!latestRun) {
    return jsonWithRequestId({ ok: true, run: null }, requestId);
  }

  const grouped = await prisma.jobRunItem.groupBy({
    by: ['status'],
    where: { runId: latestRun.id },
    _count: { _all: true }
  });

  const counts = {
    sent: grouped.find((row) => row.status === JobRunItemStatus.SENT)?._count._all ?? 0,
    skipped: grouped.find((row) => row.status === JobRunItemStatus.SKIPPED)?._count._all ?? 0,
    failed: grouped.find((row) => row.status === JobRunItemStatus.FAILED)?._count._all ?? 0,
    timedOut: grouped.find((row) => row.status === JobRunItemStatus.TIMED_OUT)?._count._all ?? 0
  };

  return jsonWithRequestId(
    {
      ok: true,
      run: {
        id: latestRun.id,
        type: latestRun.type,
        status: latestRun.status,
        requestId: latestRun.requestId,
        startedAt: latestRun.startedAt.toISOString(),
        endedAt: latestRun.endedAt?.toISOString() ?? null,
        metrics: latestRun.metrics,
        counts,
        items: latestRun.items.map((item) => ({
          id: item.id,
          userId: item.userId,
          status: item.status,
          attempts: item.attempts,
          durationMs: item.durationMs,
          error: item.error,
          createdAt: item.createdAt.toISOString()
        }))
      }
    },
    requestId
  );
}
