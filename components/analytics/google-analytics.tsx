'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { CONSENT_UPDATED_EVENT, readConsent, type ConsentStatus } from '@/lib/analytics/consent';

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function pushConsent(status: ConsentStatus) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const granted = status === 'granted';

  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  if (granted) {
    window.gtag('event', 'page_view');
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    const sync = () => {
      const consent = readConsent();
      pushConsent(consent.analytics);
    };

    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
    };
  }, []);

  if (!googleAnalyticsId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          const storedConsent = window.localStorage.getItem('calmagest-consent');
          let analyticsConsent = 'denied';

          if (storedConsent) {
            try {
              const parsedConsent = JSON.parse(storedConsent);
              if (parsedConsent?.analytics === 'granted') {
                analyticsConsent = 'granted';
              }
            } catch (error) {
              analyticsConsent = 'denied';
            }
          }

          gtag('consent', 'default', {
            analytics_storage: analyticsConsent,
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}', { send_page_view: analyticsConsent === 'granted' });
        `}
      </Script>
    </>
  );
}
