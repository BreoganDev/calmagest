import { handleHealthGet } from '@/lib/api/healthHandler';

export async function GET(request: Request) {
  return handleHealthGet(request);
}
