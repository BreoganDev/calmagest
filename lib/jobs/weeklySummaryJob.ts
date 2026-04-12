import { JobRunItemStatus, JobRunStatus, JobRunType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/emailService';
import { buildWeeklySummary } from '@/lib/services/weeklySummaryService';
import { logger } from '@/lib/server/logger';

type WeeklySummaryJobResult = {
  runId: string;
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  timedOut: number;
  retried: number;
  degraded: boolean;
  durationMs: number;
};

function getConcurrency() {
  const raw = Number(process.env.CALMA_JOB_CONCURRENCY ?? 4);
  if (!Number.isFinite(raw)) return 4;
  return Math.max(1, Math.min(10, Math.floor(raw)));
}

function getTimeoutMs() {
  const raw = Number(process.env.CALMA_JOB_TIMEOUT_MS ?? 15000);
  if (!Number.isFinite(raw)) return 15000;
  return Math.max(1000, Math.min(60000, Math.floor(raw)));
}

function getRetries() {
  const raw = Number(process.env.CALMA_JOB_RETRIES ?? 1);
  if (!Number.isFinite(raw)) return 1;
  return Math.max(0, Math.min(3, Math.floor(raw)));
}

function getBreakerFailures() {
  const raw = Number(process.env.CALMA_SMTP_BREAKER_FAILURES ?? 3);
  if (!Number.isFinite(raw)) return 3;
  return Math.max(1, Math.min(20, Math.floor(raw)));
}

class JobTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobTimeoutError';
  }
}

async function runWithLimit<T>(items: T[], worker: (item: T) => Promise<void>) {
  const limit = getConcurrency();
  let index = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await worker(current);
      }
    })
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new JobTimeoutError(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendWeeklySummaryToUser(userId: string) {
  const pref = await prisma.notificationPreference.findFirst({
    where: {
      userId,
      type: 'weekly_summary',
      channel: 'email'
    }
  });

  if (pref && !pref.enabled) {
    return { skipped: true as const };
  }

  const payload = await buildWeeklySummary(userId);
  const result = await sendEmail(payload);
  return { skipped: false as const, result };
}

async function sendWeeklySummaryWithRetry(userId: string, requestId?: string) {
  const retries = getRetries();
  const timeoutMs = getTimeoutMs();
  let attempts = 0;

  while (attempts <= retries) {
    attempts += 1;

    try {
      const output = await withTimeout(
        sendWeeklySummaryToUser(userId),
        timeoutMs,
        `weekly summary for ${userId}`
      );

      return {
        ...output,
        attempts
      };
    } catch (error) {
      const isLastAttempt = attempts > retries;

      logger.warn('weekly-summary-attempt-failed', {
        requestId,
        userId,
        attempt: attempts,
        retries,
        timeoutMs,
        error: error instanceof Error ? error.message : String(error)
      });

      if (isLastAttempt) {
        throw error;
      }

      await sleep(250 * attempts);
    }
  }

  throw new Error('Weekly summary retry loop exited unexpectedly');
}

function resolveRunStatus(result: WeeklySummaryJobResult): JobRunStatus {
  if (result.degraded) return JobRunStatus.DEGRADED;
  if (result.failed === 0) return JobRunStatus.SUCCESS;
  if (result.sent > 0 || result.skipped > 0) return JobRunStatus.PARTIAL;
  return JobRunStatus.FAILED;
}

export async function runWeeklySummaryJob(requestId?: string): Promise<WeeklySummaryJobResult> {
  const startedAt = Date.now();
  const users = await prisma.user.findMany({
    select: { id: true }
  });

  const run = await prisma.jobRun.create({
    data: {
      type: JobRunType.WEEKLY_SUMMARY,
      status: JobRunStatus.RUNNING,
      requestId
    }
  });

  const result: WeeklySummaryJobResult = {
    runId: run.id,
    total: users.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    timedOut: 0,
    retried: 0,
    degraded: false,
    durationMs: 0
  };

  const breakerFailures = getBreakerFailures();
  let failureStreak = 0;
  let circuitOpen = false;

  logger.info('weekly-summary-started', {
    requestId,
    runId: run.id,
    total: users.length,
    concurrency: getConcurrency(),
    timeoutMs: getTimeoutMs(),
    retries: getRetries(),
    breakerFailures
  });

  await runWithLimit(users, async (user) => {
    if (circuitOpen) {
      result.skipped += 1;
      await prisma.jobRunItem.create({
        data: {
          runId: run.id,
          userId: user.id,
          status: JobRunItemStatus.SKIPPED,
          attempts: 0,
          error: 'SMTP circuit breaker open'
        }
      });
      return;
    }

    const userStartedAt = Date.now();

    try {
      const output = await sendWeeklySummaryWithRetry(user.id, requestId);
      const durationMs = Date.now() - userStartedAt;
      if (output.attempts > 1) {
        result.retried += output.attempts - 1;
      }

      if (output.skipped) {
        result.skipped += 1;
        await prisma.jobRunItem.create({
          data: {
            runId: run.id,
            userId: user.id,
            status: JobRunItemStatus.SKIPPED,
            attempts: output.attempts,
            durationMs
          }
        });
      } else {
        result.sent += 1;
        await prisma.jobRunItem.create({
          data: {
            runId: run.id,
            userId: user.id,
            status: JobRunItemStatus.SENT,
            attempts: output.attempts,
            durationMs
          }
        });
      }

      failureStreak = 0;
    } catch (error) {
      const durationMs = Date.now() - userStartedAt;
      result.failed += 1;
      failureStreak += 1;

      const isTimeout = error instanceof JobTimeoutError;
      if (isTimeout) {
        result.timedOut += 1;
      }

      await prisma.jobRunItem.create({
        data: {
          runId: run.id,
          userId: user.id,
          status: isTimeout ? JobRunItemStatus.TIMED_OUT : JobRunItemStatus.FAILED,
          attempts: getRetries() + 1,
          durationMs,
          error: error instanceof Error ? error.message : String(error)
        }
      });

      if (failureStreak >= breakerFailures) {
        circuitOpen = true;
        result.degraded = true;
        logger.error('weekly-summary-circuit-open', {
          requestId,
          runId: run.id,
          failureStreak,
          breakerFailures
        });
      }

      logger.error('weekly-summary-failed', {
        requestId,
        runId: run.id,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  result.durationMs = Date.now() - startedAt;
  const finalStatus = resolveRunStatus(result);

  await prisma.jobRun.update({
    where: { id: run.id },
    data: {
      status: finalStatus,
      endedAt: new Date(),
      metrics: {
        total: result.total,
        sent: result.sent,
        skipped: result.skipped,
        failed: result.failed,
        timedOut: result.timedOut,
        retried: result.retried,
        degraded: result.degraded,
        durationMs: result.durationMs,
        breakerFailures
      }
    }
  });

  logger.info('weekly-summary-finished', {
    requestId,
    status: finalStatus,
    ...result
  });

  return result;
}
