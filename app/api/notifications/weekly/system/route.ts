import { handleWeeklySystemPost } from '@/lib/api/weeklySystemHandler';

export async function POST(request: Request) {
  return handleWeeklySystemPost(request);
}
