import { runWeeklySummaryJob } from '@/lib/jobs/weeklySummaryJob';
import { logger } from '@/lib/server/logger';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export type WeeklySystemDeps = {
  runWeeklySummaryJob: typeof runWeeklySummaryJob;
  getExpectedToken: () => string;
};

const defaultDeps: WeeklySystemDeps = {
  runWeeklySummaryJob,
  getExpectedToken: () => process.env.CALMA_WEEKLY_TOKEN ?? ''
};

export async function handleWeeklySystemPost(request: Request, deps: WeeklySystemDeps = defaultDeps) {
  const requestId = getRequestId(request);
  const authHeader = request.headers.get('authorization') ?? '';
  const token =
    request.headers.get('x-cron-token')?.trim() ||
    authHeader.replace('Bearer ', '').trim();
  const expectedToken = deps.getExpectedToken();

  if (!expectedToken || token !== expectedToken) {
    logger.warn('weekly-summary-unauthorized', { requestId });
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const result = await deps.runWeeklySummaryJob(requestId);
  return jsonWithRequestId({ ok: true, ...result }, requestId);
}
