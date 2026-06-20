export const CONSENT_STORAGE_KEY = 'calmagest-consent';
export const CONSENT_UPDATED_EVENT = 'calmagest:consent-changed';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export type ConsentState = {
  necessary: true;
  analytics: ConsentStatus;
  updatedAt: string;
};

export const defaultConsentState = (): ConsentState => ({
  necessary: true,
  analytics: 'pending',
  updatedAt: new Date(0).toISOString()
});

export function isConsentState(value: unknown): value is ConsentState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ConsentState>;

  return (
    candidate.necessary === true &&
    (candidate.analytics === 'pending' ||
      candidate.analytics === 'granted' ||
      candidate.analytics === 'denied') &&
    typeof candidate.updatedAt === 'string'
  );
}

export function readConsent(): ConsentState {
  if (typeof window === 'undefined') {
    return defaultConsentState();
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return defaultConsentState();
    }

    const parsed: unknown = JSON.parse(raw);
    return isConsentState(parsed) ? parsed : defaultConsentState();
  } catch {
    return defaultConsentState();
  }
}

export function writeConsent(analytics: Exclude<ConsentStatus, 'pending'>): ConsentState {
  const nextState: ConsentState = {
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Keep the in-memory state even if storage fails.
    }
  }

  return nextState;
}

export function notifyConsentChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
}
