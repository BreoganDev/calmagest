import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendWeeklySummaryToUser } from '@/lib/jobs/weeklySummaryJob';
import { logger } from '@/lib/server/logger';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const result = await sendWeeklySummaryToUser(session.user.id);
  if (result.skipped) {
    logger.info('weekly-summary-skipped', { requestId, userId: session.user.id });
    return jsonWithRequestId({ ok: true, skipped: true }, requestId);
  }

  logger.info('weekly-summary-sent', { requestId, userId: session.user.id });
  return jsonWithRequestId({ ok: true, result: result.result }, requestId);
}
