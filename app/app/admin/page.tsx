import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isAdminEmail } from '@/lib/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminUserRow } from '@/components/app/admin-user-row';
import { AdminCreateUser } from '@/components/app/admin-create-user';
import { PageHeader } from '@/components/app/page-header';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) redirect('/app');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="grid gap-6">
      <div>
        <PageHeader
          eyebrow="Administración"
          title="Panel admin"
          subtitle="Gestión de usuarios y mensajes."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminCreateUser />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {users.map((user) => (
            <AdminUserRow key={user.id} id={user.id} email={user.email} name={user.name} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
