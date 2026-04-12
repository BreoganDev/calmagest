import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankCsvImport } from '@/components/app/bank-csv-import';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export default async function BankPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [connection, accounts] = await Promise.all([
    prisma.bankConnection.findFirst({
      where: { userId: session.user.id, provider: 'truelayer', status: 'active' }
    }),
    prisma.bankAccount.findMany({
      where: { connection: { userId: session.user.id } },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 50
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <PageHeader
          eyebrow="Solo lectura"
          title="Banco"
          subtitle="Aquí verás domiciliaciones, cargos y movimientos con tarjeta."
        />
      </div>

      {!connection && (
        <Card className="animate-rise">
          <CardContent>
            <EmptyState title="Aún no hay banco conectado." body="Ve a Ajustes y conecta TrueLayer." />
          </CardContent>
        </Card>
      )}

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Importar CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <BankCsvImport />
        </CardContent>
      </Card>

      {accounts.map((account) => (
        <Card key={account.id} className="animate-rise">
          <CardHeader>
            <CardTitle>{account.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {account.transactions.length === 0 ? (
              <EmptyState title="Sin movimientos todavía." body="Cuando sincronices o importes, aparecerán aquí." />
            ) : (
              <div className="grid gap-3">
                {account.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft"
                  >
                    <div>
                      <div className="text-sm font-medium">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      <Money amount={tx.amount} currency={tx.currency ?? 'EUR'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
