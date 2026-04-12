import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  await prisma.$transaction([
    prisma.expense.updateMany({
      where: { userId: session.user.id, amount: { lt: 0 } },
      data: { amount: { multiply: -1 } }
    }),
    prisma.fixedExpense.updateMany({
      where: { userId: session.user.id, amount: { lt: 0 } },
      data: { amount: { multiply: -1 } }
    }),
    prisma.monthFixedExpense.updateMany({
      where: { userId: session.user.id, amount: { lt: 0 } },
      data: { amount: { multiply: -1 } }
    })
  ]);

  return jsonWithRequestId({ ok: true }, requestId);
}
