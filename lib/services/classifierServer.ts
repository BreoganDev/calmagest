import { prisma } from '@/lib/prisma';
import { suggestClassification } from '@/lib/services/classifierService';

export async function classifyWithUserRules(userId: string, name: string) {
  const base = suggestClassification(name);
  const rules = await prisma.classificationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const text = name.toLowerCase();
  const matched = rules.find((r) => text.includes(r.pattern));
  if (matched) {
    return {
      category: matched.category,
      isFixed: matched.isFixed,
      importance: matched.importance,
      reason: `Regla: ${matched.pattern}`
    };
  }

  return base;
}
