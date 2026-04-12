import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80).optional().or(z.literal('')),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  currency: z.string().min(3).max(3).default('EUR'),
  timezone: z.string().min(3).default('Europe/Madrid')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const fixedExpenseSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  amount: z.number().int().min(0).optional(),
  category: z.string().min(2).max(40).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  active: z.boolean().optional()
});

export const expenseSchema = z.object({
  date: z.string().min(10).optional(),
  name: z.string().min(2).max(80).optional(),
  amount: z.number().int().min(0).optional(),
  category: z.string().min(2).max(40).optional(),
  importance: z.enum(['VITAL', 'NEUTRO', 'SUPERFLUO']).optional(),
  notes: z.string().max(240).optional()
});

export const fixedExpenseCreateSchema = fixedExpenseSchema.required({
  name: true,
  amount: true,
  category: true
});

export const expenseCreateSchema = expenseSchema.required({
  date: true,
  name: true,
  amount: true,
  category: true
});

export const categoryBudgetBulkSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  budgets: z.record(
    z.string().min(2).max(40),
    z.number().int().min(0).max(100_000_000)
  )
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2_000),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256)
  })
});

const isoDateSchema = z.string().datetime({ offset: true });
const backupRecordSchema = z.object({
  id: z.string().min(1),
  createdAt: isoDateSchema
});
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);
const importanceSchema = z.enum(['VITAL', 'NEUTRO', 'SUPERFLUO']);
const suggestionStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);

export const userBackupSchema = z.object({
  meta: z.object({
    version: z.literal(2),
    schemaHash: z.string().length(64),
    exportedAt: isoDateSchema
  }),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().max(255).nullable(),
    currency: z.string().min(3).max(8),
    timezone: z.string().min(3).max(100),
    defaultIncome: z.number().int(),
    defaultBudget: z.number().int()
  }),
  months: z.array(
    backupRecordSchema.extend({
      yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
      budget: z.number().int(),
      income: z.number().int(),
      carryOver: z.number().int()
    })
  ),
  monthFixedExpenses: z.array(
    backupRecordSchema.extend({
      userId: z.string().min(1),
      monthId: z.string().min(1),
      name: z.string().min(1).max(255),
      amount: z.number().int(),
      category: z.string().min(1).max(80),
      dayOfMonth: z.number().int().min(1).max(31).nullable(),
      active: z.boolean()
    })
  ),
  fixedExpenses: z.array(
    backupRecordSchema.extend({
      name: z.string().min(1).max(255),
      amount: z.number().int(),
      category: z.string().min(1).max(80),
      dayOfMonth: z.number().int().min(1).max(31).nullable(),
      active: z.boolean()
    })
  ),
  fixedBudgets: z.array(
    backupRecordSchema.extend({
      category: z.string().min(1).max(80),
      limitAmount: z.number().int(),
      active: z.boolean()
    })
  ),
  expenses: z.array(
    backupRecordSchema.extend({
      monthId: z.string().min(1),
      date: isoDateSchema,
      name: z.string().min(1).max(255),
      amount: z.number().int(),
      category: z.string().min(1).max(80),
      importance: importanceSchema.nullable(),
      notes: z.string().max(1000).nullable()
    })
  ),
  expenseSuggestions: z.array(
    backupRecordSchema.extend({
      date: isoDateSchema,
      name: z.string().min(1).max(255),
      amount: z.number().int(),
      category: z.string().min(1).max(80),
      importance: importanceSchema,
      notes: z.string().max(1000).nullable(),
      source: z.string().min(1).max(120),
      status: suggestionStatusSchema
    })
  ),
  categoryBudgets: z.array(
    z.object({
      id: z.string().min(1),
      category: z.string().min(1).max(80),
      budget: z.number().int(),
      yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
      createdAt: isoDateSchema
    })
  ),
  savingsRule: z
    .object({
      id: z.string().min(1),
      savingsPct: z.number().int().min(0).max(100),
      investPct: z.number().int().min(0).max(100),
      createdAt: isoDateSchema
    })
    .nullable(),
  goals: z.array(
    backupRecordSchema.extend({
      name: z.string().min(1).max(255),
      targetAmount: z.number().int(),
      targetDate: isoDateSchema.nullable(),
      priority: z.number().int(),
      status: z.string().min(1).max(80)
    })
  ),
  goalContributions: z.array(
    z.object({
      id: z.string().min(1),
      goalId: z.string().min(1),
      amount: z.number().int(),
      date: isoDateSchema,
      note: z.string().max(1000).nullable(),
      source: z.string().min(1).max(120),
      type: z.string().min(1).max(120)
    })
  ),
  savingsAccount: z
    .object({
      id: z.string().min(1),
      balance: z.number().int(),
      createdAt: isoDateSchema
    })
    .nullable(),
  savingsTransactions: z.array(
    z.object({
      id: z.string().min(1),
      amount: z.number().int(),
      date: isoDateSchema,
      note: z.string().max(1000).nullable()
    })
  ),
  investmentAccount: z
    .object({
      id: z.string().min(1),
      balance: z.number().int(),
      createdAt: isoDateSchema
    })
    .nullable(),
  investmentTransactions: z.array(
    z.object({
      id: z.string().min(1),
      amount: z.number().int(),
      date: isoDateSchema,
      note: z.string().max(1000).nullable()
    })
  ),
  investmentPlans: z.array(
    backupRecordSchema.extend({
      name: z.string().min(1).max(255),
      type: z.string().min(1).max(80),
      targetAmount: z.number().int().nullable(),
      riskLevel: z.string().min(1).max(80),
      annualInterestPct: z.number().nullable(),
      currentValue: z.number().int().nullable(),
      notes: z.string().max(2000).nullable()
    })
  ),
  investmentHoldings: z.array(
    z.object({
      id: z.string().min(1),
      planId: z.string().min(1).nullable(),
      kind: z.string().min(1).max(80),
      name: z.string().min(1).max(255),
      symbol: z.string().max(40).nullable(),
      provider: z.string().max(80).nullable(),
      providerId: z.string().max(120).nullable(),
      quantity: z.string().min(1),
      costBasis: z.number().int(),
      createdAt: isoDateSchema
    })
  ),
  investmentContributions: z.array(
    backupRecordSchema.extend({
      planId: z.string().min(1),
      amount: z.number().int(),
      date: isoDateSchema,
      note: z.string().max(1000).nullable()
    })
  ),
  classificationRules: z.array(
    backupRecordSchema.extend({
      pattern: z.string().min(1).max(255),
      category: z.string().min(1).max(80),
      isFixed: z.boolean(),
      importance: importanceSchema
    })
  ),
  notifications: z.array(
    backupRecordSchema.extend({
      type: z.string().min(1).max(80),
      severity: z.string().min(1).max(40),
      title: z.string().min(1).max(255),
      body: z.string().min(1).max(4000),
      data: jsonValueSchema,
      dedupeKey: z.string().min(1).max(255),
      readAt: isoDateSchema.nullable()
    })
  ),
  notificationPreferences: z.array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1).max(80),
      channel: z.string().min(1).max(40),
      enabled: z.boolean(),
      createdAt: isoDateSchema
    })
  ),
  achievements: z.array(
    z.object({
      id: z.string().min(1),
      key: z.string().min(1).max(120),
      unlockedAt: isoDateSchema,
      meta: jsonValueSchema
    })
  ),
  bankConnections: z.array(
    z.object({
      id: z.string().min(1),
      provider: z.string().min(1).max(80),
      status: z.string().min(1).max(40),
      state: z.string().max(255).nullable(),
      scope: z.string().max(255).nullable(),
      accessToken: z.string().nullable(),
      refreshToken: z.string().nullable(),
      expiresAt: isoDateSchema.nullable(),
      createdAt: isoDateSchema
    })
  ),
  bankAccounts: z.array(
    z.object({
      id: z.string().min(1),
      connectionId: z.string().min(1),
      providerAccountId: z.string().min(1).max(255),
      name: z.string().min(1).max(255),
      type: z.string().max(80).nullable(),
      currency: z.string().max(16).nullable(),
      createdAt: isoDateSchema
    })
  ),
  bankTransactions: z.array(
    z.object({
      id: z.string().min(1),
      accountId: z.string().min(1),
      providerTransactionId: z.string().min(1).max(255),
      date: isoDateSchema,
      description: z.string().min(1).max(1000),
      amount: z.number().int(),
      currency: z.string().max(16).nullable(),
      createdAt: isoDateSchema
    })
  ),
  pushSubscriptions: z.array(
    z.object({
      id: z.string().min(1),
      endpoint: z.string().url().max(2000),
      p256dh: z.string().min(16).max(512),
      auth: z.string().min(8).max(256),
      createdAt: isoDateSchema
    })
  )
});
