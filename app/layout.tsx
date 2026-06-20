import type { Metadata, Viewport } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ConsentBanner } from '@/components/analytics/consent-banner';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { UpdateToast } from '@/components/app/update-toast';
import { DevServiceWorkerCleanup } from '@/components/app/dev-sw-cleanup';
import { SITE_CONFIG, absoluteUrl } from '@/lib/seo/config';
import { organizationJsonLd, websiteJsonLd, jsonLdScriptProps } from '@/lib/seo/json-ld';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — Controla tu dinero sin que el dinero te controle a ti`,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.creator }],
  creator: SITE_CONFIG.creator,
  publisher: SITE_CONFIG.publisher,
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon-32x32.png',
    apple: '/CalmaGest512.png'
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'es-ES': SITE_CONFIG.url,
      'es': SITE_CONFIG.url
    }
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — Controla tu dinero sin que el dinero te controle a ti`,
    description: SITE_CONFIG.shortDescription,
    images: [
      {
        url: absoluteUrl(SITE_CONFIG.ogImage),
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.ogImageAlt
      }
    ]
  },
  twitter: {
    card: SITE_CONFIG.social.twitterCardType,
    title: `${SITE_CONFIG.name} — Controla tu dinero sin que el dinero te controle a ti`,
    description: SITE_CONFIG.shortDescription,
    images: [absoluteUrl(SITE_CONFIG.ogImage)],
    site: SITE_CONFIG.social.twitter,
    creator: SITE_CONFIG.social.twitter
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${nunito.variable} ${plusJakarta.variable} dark`} suppressHydrationWarning>
      <head>
        <script {...jsonLdScriptProps(organizationJsonLd())} />
        <script {...jsonLdScriptProps(websiteJsonLd())} />
      </head>
      <body className="min-h-screen bg-background font-app text-foreground">
        <GoogleAnalytics />
        <DevServiceWorkerCleanup />
        {children}
        <ConsentBanner />
        <UpdateToast />
      </body>
    </html>
  );
}
