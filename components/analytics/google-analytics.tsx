'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CONSENT_UPDATED_EVENT, readConsent } from '@/lib/analytics/consent';

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const consent = readConsent();
      setEnabled(consent.analytics === 'granted');
    };

    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
    };
  }, []);

  if (!googleAnalyticsId || !enabled) {
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
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `}
      </Script>
    </>
  );
}
