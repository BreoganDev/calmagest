import crypto from 'crypto';

const env = (key: string) => process.env[key] ?? '';

export const truelayerConfig = {
  clientId: env('TRUELAYER_CLIENT_ID'),
  clientSecret: env('TRUELAYER_CLIENT_SECRET'),
  redirectUri: env('TRUELAYER_REDIRECT_URI'),
  authBase: env('TRUELAYER_AUTH_BASE') || 'https://auth.truelayer-sandbox.com',
  apiBase: env('TRUELAYER_API_BASE') || 'https://api.truelayer-sandbox.com'
};

export function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

export async function createAuthLink(state: string) {
  const payload = {
    client_id: truelayerConfig.clientId,
    redirect_uri: truelayerConfig.redirectUri,
    response_type: 'code',
    scope: 'accounts transactions',
    state
  };

  const res = await fetch(`${truelayerConfig.authBase}/v1/authuri`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || 'Failed to create auth link');
  }

  const data = JSON.parse(text) as { auth_uri?: string };
  if (!data.auth_uri) throw new Error('Auth URI missing');
  return data.auth_uri;
}

export async function exchangeCode(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: truelayerConfig.clientId,
    client_secret: truelayerConfig.clientSecret,
    redirect_uri: truelayerConfig.redirectUri,
    code
  });

  const res = await fetch(`${truelayerConfig.authBase}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!res.ok) {
    throw new Error('Token exchange failed');
  }

  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
}

export async function fetchAccounts(accessToken: string) {
  const res = await fetch(`${truelayerConfig.apiBase}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return (await res.json()) as { results: Array<{ account_id: string; account_type?: string; display_name?: string; currency?: string }> };
}

export async function fetchTransactions(accessToken: string, accountId: string) {
  const res = await fetch(`${truelayerConfig.apiBase}/data/v1/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return (await res.json()) as { results: Array<{ transaction_id: string; description?: string; amount: number; currency?: string; timestamp: string }> };
}
