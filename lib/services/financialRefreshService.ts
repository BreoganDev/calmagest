import { refreshDashboardSignals } from '@/lib/services/dashboardSignalService';
import { logger } from '@/lib/server/logger';

export async function refreshFinancialSignals(userId: string) {
  try {
    await refreshDashboardSignals(userId);
  } catch (error) {
    logger.error('financial-refresh-failed', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
