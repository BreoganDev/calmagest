import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { upsertCategoryBudget } from '@/lib/services/categoryBudgetService';
import { categoryBudgetBulkSchema } from '@/lib/validation';
import { logger } from '@/lib/server/logger';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = categoryBudgetBulkSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithRequestId({ error: 'Invalid payload' }, requestId, { status: 400 });
    }

    const entries = Object.entries(parsed.data.budgets);
    await Promise.all(
      entries.map(([category, budget]) =>
        upsertCategoryBudget(session.user.id, category.trim(), parsed.data.yearMonth, budget)
      )
    );

    return jsonWithRequestId({ success: true, updated: entries.length }, requestId);
  } catch (error) {
    logger.error('save-category-budgets-failed', {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    return jsonWithRequestId({ error: 'Internal server error' }, requestId, { status: 500 });
  }
}
