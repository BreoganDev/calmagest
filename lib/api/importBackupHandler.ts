import { getUserSession, type UserBackup } from '@/lib/services/exportService';
import {
  restoreUserBackupTransactional,
  validateUserBackupPayload
} from '@/lib/services/backupRestoreService';
import { logger } from '@/lib/server/logger';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';
import { userBackupSchema } from '@/lib/validation';

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export type ImportBackupDeps = {
  getUserSession: typeof getUserSession;
  validateUserBackupPayload: typeof validateUserBackupPayload;
  restoreUserBackupTransactional: typeof restoreUserBackupTransactional;
};

const defaultDeps: ImportBackupDeps = {
  getUserSession,
  validateUserBackupPayload,
  restoreUserBackupTransactional
};

export async function handleImportBackup(request: Request, deps: ImportBackupDeps = defaultDeps) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  let userId = '';
  try {
    userId = await deps.getUserSession();
  } catch (error) {
    if (isUnauthorized(error)) {
      return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
    }
    throw error;
  }

  const body = (await request.json().catch(() => null)) as UserBackup | null;

  const parsed = userBackupSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('backup-import-invalid', {
      requestId,
      userId,
      issues: parsed.error.issues.map((issue) => issue.path.join('.'))
    });
    return jsonWithRequestId({ message: 'JSON invalido' }, requestId, { status: 400 });
  }

  const validation = deps.validateUserBackupPayload(parsed.data as UserBackup);
  if (!validation.ok) {
    logger.warn('backup-import-validation-failed', {
      requestId,
      userId,
      issueCount: validation.issues.length
    });
    return jsonWithRequestId(
      { ok: false, dryRun, issues: validation.issues, stats: validation.stats },
      requestId,
      { status: dryRun ? 200 : 400 }
    );
  }

  if (dryRun) {
    return jsonWithRequestId({ ok: true, dryRun: true, stats: validation.stats }, requestId);
  }

  await deps.restoreUserBackupTransactional(userId, parsed.data as UserBackup);
  logger.info('backup-import-restored', {
    requestId,
    userId,
    version: parsed.data.meta.version
  });

  return jsonWithRequestId({ ok: true }, requestId);
}
