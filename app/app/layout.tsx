import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';
import { BottomNav } from '@/components/app/bottom-nav';
import { prisma } from '@/lib/prisma';
import { getYearMonth } from '@/lib/services/monthService';
import { isAdminEmail } from '@/lib/services/adminService';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ZenProvider } from '@/components/providers/zen-provider';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta'
});

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true }
  });

  const timezone = user?.timezone ?? 'Europe/Madrid';
  const currentYearMonth = getYearMonth(timezone);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null }
    })
  ]);
  const notificationPayload = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    severity: n.severity,
    type: n.type,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString()
  }));

  const isAdmin = isAdminEmail(session.user.email);

  return (
    <div className={`${plusJakarta.variable} font-app min-h-screen bg-background overflow-x-hidden`}>
      <ToastProvider>
        <ZenProvider>
          <div className="mx-auto w-full max-w-[72rem] px-4 py-6 md:max-w-none md:px-6 md:py-8 xl:max-w-[1400px] xl:px-10">
            <div className="flex flex-col gap-4 md:flex-row md:gap-6">
              <Sidebar isAdmin={isAdmin} />
              <div className="flex-1 min-w-0 pb-56 md:pb-0">
                <div className="mx-auto w-full min-w-0 max-w-[420px] space-y-4 sm:space-y-6 md:max-w-none">
                  <Topbar
                    userName={session.user.name}
                    currentYearMonth={currentYearMonth}
                    notifications={notificationPayload}
                    unreadCount={unreadCount}
                  />
                  {children}
                </div>
              </div>
            </div>
          </div>
          <BottomNav isAdmin={isAdmin} />
        </ZenProvider>
      </ToastProvider>
    </div>
  );
}
