import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAllCategoryBudgets } from '@/lib/services/categoryBudgetService';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { BudgetEditClient } from './budget-edit-client';

export const dynamic = 'force-dynamic';

export default async function BudgetEditPage({
    searchParams
}: {
    searchParams: Promise<{ ym?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }
    const params = await searchParams;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
    });

    const month = await getOrCreateMonthByYearMonth(
        session.user.id,
        user?.timezone ?? 'Europe/Madrid',
        params.ym
    );

    const budgets = await getAllCategoryBudgets(session.user.id, month.yearMonth);

    // Convert to Record<string, number>
    const initialBudgets: Record<string, number> = {};
    budgets.forEach((b) => {
        initialBudgets[b.category] = b.budget;
    });

    return <BudgetEditClient initialBudgets={initialBudgets} yearMonth={month.yearMonth} />;
}
