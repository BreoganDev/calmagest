import { handleExportBackup } from '@/lib/api/exportBackupHandler';

export async function GET(request: Request) {
  return handleExportBackup(request);
}
