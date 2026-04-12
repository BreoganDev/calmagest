import { NextResponse } from 'next/server';
import { buildUserBackup, getUserSession } from '@/lib/services/exportService';
import { getRequestId } from '@/lib/server/request-context';

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export type ExportBackupDeps = {
  buildUserBackup: typeof buildUserBackup;
  getUserSession: typeof getUserSession;
  now: () => Date;
};

const defaultDeps: ExportBackupDeps = {
  buildUserBackup,
  getUserSession,
  now: () => new Date()
};

export async function handleExportBackup(request: Request, deps: ExportBackupDeps = defaultDeps) {
  const requestId = getRequestId(request);

  try {
    const userId = await deps.getUserSession();
    const backup = await deps.buildUserBackup(userId);

    const response = NextResponse.json(backup, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="calma-eco-backup-${deps.now().toISOString().slice(0, 10)}.json"`
      }
    });
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (error) {
    if (isUnauthorized(error)) {
      const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }

    throw error;
  }
}
