import type { Metadata, Viewport } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { UpdateToast } from '@/components/app/update-toast';
import { DevServiceWorkerCleanup } from '@/components/app/dev-sw-cleanup';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: 'Calma Gest',
  description: 'Economia y vida en orden, sin culpa.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon-32x32.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#E7A9B4'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${nunito.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-[var(--font-nunito)]">
        <DevServiceWorkerCleanup />
        {children}
        <UpdateToast />
      </body>
    </html>
  );
}
