export type UxEventName =
  | 'month_changed'
  | 'quick_action_clicked'
  | 'filter_changed'
  | 'form_submit_clicked'
  | 'drawer_opened'
  | 'drawer_closed'
  | 'ui_error_shown';

export function trackUxEvent(name: UxEventName, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const detail = {
    name,
    payload: payload ?? {},
    ts: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent('calma:ux-event', { detail }));
  if (process.env.NODE_ENV !== 'production') {
    // Keep console telemetry only in development.
    // eslint-disable-next-line no-console
    console.debug('[ux-event]', detail);
  }
}
