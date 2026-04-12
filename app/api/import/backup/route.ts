import { handleImportBackup } from '@/lib/api/importBackupHandler';

export async function POST(request: Request) {
  return handleImportBackup(request);
}
