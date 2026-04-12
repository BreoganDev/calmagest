import { formatMoney } from '@/lib/services/moneyService';
import { normalizeCategory } from '@/lib/services/textService';
import { Expense, Month } from '@prisma/client';

export interface CoachInsight {
    type: 'alert' | 'praise' | 'tip';
    message: string;
    actionLabel?: string;
    actionUrl?: string;
    impact?: number; // Estimated money saved/lost
    severity?: 'low' | 'medium' | 'high';
}

interface CoachContext {
    currentExpenses: Expense[];
    currentMonth: Month;
    historyExpenses: Expense[]; // Flat list of expenses from previous months
    currency: string;
}

export function generateCoachInsights(context: CoachContext): CoachInsight[] {
    const insights: CoachInsight[] = [];
    const { currentExpenses, historyExpenses, currency } = context;

    // 1. Analyze Trends (Current vs History Average by Category)
    const currentCategorized = groupByCategory(currentExpenses);
    const historyCategorized = groupByCategory(historyExpenses);

    // Calculate historical monthly average (assuming historyExpenses covers X months)
    // We need to know how many months are in history to average correctly. 
    // For simplicity here, we'll assume the caller passes ~3-6 months and we normalize by unique monthIds.
    const uniqueMonths = new Set(historyExpenses.map(e => e.monthId)).size || 1;

    for (const [category, amount] of Object.entries(currentCategorized)) {
        const historyTotal = historyCategorized[category] || 0;
        const historyAvg = historyTotal / uniqueMonths;

        // Threshold: 20% higher than average and absolute difference > 50
        if (historyAvg > 0 && amount > historyAvg * 1.2 && (amount - historyAvg) > 50) {
            const diff = amount - historyAvg;
            insights.push({
                type: 'alert',
                severity: 'medium',
                message: `Estás gastando ${formatMoney(diff, currency)} más de lo habitual en ${category}.`,
                impact: diff,
                actionLabel: 'Ver detalles',
                actionUrl: `/app/expenses?search=${encodeURIComponent(category)}`
            });
        }
    }

    // 2. Anomaly Detection (Single large expense)
    // Threshold: Expense > 30% of total budget (need budget access? or just absolute value > 200?)
    // Let's use absolute value for now, e.g., > 150 currency units and tagged "SUPERFLUO" or just generic.
    const largeExpenses = currentExpenses.filter(e => e.amount > 300); // Configurable threshold
    for (const expense of largeExpenses) {
        insights.push({
            type: 'alert',
            severity: 'high',
            message: `Gasto inusual detectado: ${expense.name} (${formatMoney(expense.amount, currency)}).`,
            impact: expense.amount
        });
    }

    // 3. Positive Reinforcement (Zero spend days or low category spend)
    // Check if "Restaurants" (Ocio/Restaurantes) is 0 or low compared to average
    const leisureKeywords = ['ocio', 'restaurante', 'cine', 'bar', 'salidas'];
    const currentLeisure = currentExpenses
        .filter(e => leisureKeywords.some(k => normalizeCategory(e.category).includes(k)))
        .reduce((sum, e) => sum + e.amount, 0);

    const historyLeisure = historyExpenses
        .filter(e => leisureKeywords.some(k => normalizeCategory(e.category).includes(k)))
        .reduce((sum, e) => sum + e.amount, 0);
    const historyLeisureAvg = historyLeisure / uniqueMonths;

    if (uniqueMonths > 0 && currentLeisure < historyLeisureAvg * 0.8 && historyLeisureAvg > 50) {
        const saved = historyLeisureAvg - currentLeisure;
        insights.push({
            type: 'praise',
            severity: 'low',
            message: `¡Bien hecho! Has ahorrado ${formatMoney(saved, currency)} en ocio comparado con tu promedio.`,
            impact: saved
        });
    }

    // 4. Fallback / General Tip
    if (insights.length === 0) {
        insights.push({
            type: 'tip',
            severity: 'low',
            message: 'Revisa tus gastos hormiga semanalmente para evitar sorpresas.'
        });
    }

    // Sort by severity (High first)
    const severityMap = { high: 3, medium: 2, low: 1 };
    return insights.sort((a, b) => (severityMap[b.severity || 'low'] - severityMap[a.severity || 'low']));
}

function groupByCategory(expenses: Expense[]): Record<string, number> {
    return expenses.reduce((acc, expense) => {
        const key = normalizeCategory(expense.category || 'Otros');
        acc[key] = (acc[key] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
}
