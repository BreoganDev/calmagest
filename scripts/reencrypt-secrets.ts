import { prisma } from '@/lib/prisma';
import {
  decryptValue,
  encryptValue,
  hashValue,
  isEncryptedValue
} from '@/lib/server/secret-box';

function getEncryptedUpdate(value?: string | null) {
  if (!value || isEncryptedValue(value)) {
    return null;
  }

  return encryptValue(value);
}

async function main() {
  let updatedAccounts = 0;
  let updatedBankConnections = 0;
  let updatedPushSubscriptions = 0;

  const [pushSubscriptionSchema] = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('PushSubscription', 'pushsubscription')
        AND column_name IN ('endpointHash', 'endpointhash')
    ) AS "exists"
  `);

  if (!pushSubscriptionSchema?.exists) {
    throw new Error(
      'Missing PushSubscription.endpointHash column. Run `npx prisma migrate deploy` before `npm run secrets:reencrypt`.'
    );
  }

  const accounts = await prisma.account.findMany({
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      id_token: true
    }
  });

  for (const account of accounts) {
    const data = {
      access_token: getEncryptedUpdate(account.access_token),
      refresh_token: getEncryptedUpdate(account.refresh_token),
      id_token: getEncryptedUpdate(account.id_token)
    };

    if (data.access_token || data.refresh_token || data.id_token) {
      await prisma.account.update({
        where: { id: account.id },
        data
      });
      updatedAccounts += 1;
    }
  }

  const bankConnections = await prisma.bankConnection.findMany({
    select: {
      id: true,
      accessToken: true,
      refreshToken: true
    }
  });

  for (const connection of bankConnections) {
    const data = {
      accessToken: getEncryptedUpdate(connection.accessToken),
      refreshToken: getEncryptedUpdate(connection.refreshToken)
    };

    if (data.accessToken || data.refreshToken) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data
      });
      updatedBankConnections += 1;
    }
  }

  const pushSubscriptions = await prisma.pushSubscription.findMany({
    select: {
      id: true,
      endpoint: true,
      endpointHash: true,
      p256dh: true,
      auth: true
    }
  });

  for (const subscription of pushSubscriptions) {
    const decryptedEndpoint = decryptValue(subscription.endpoint) ?? '';
    const expectedEndpointHash = decryptedEndpoint ? hashValue(decryptedEndpoint) : subscription.endpointHash;
    const endpoint = getEncryptedUpdate(subscription.endpoint);
    const p256dh = getEncryptedUpdate(subscription.p256dh);
    const auth = getEncryptedUpdate(subscription.auth);
    const endpointHash =
      expectedEndpointHash !== subscription.endpointHash ? expectedEndpointHash : undefined;

    if (endpoint || endpointHash || p256dh || auth) {
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          ...(endpoint ? { endpoint } : {}),
          ...(endpointHash ? { endpointHash } : {}),
          ...(p256dh ? { p256dh } : {}),
          ...(auth ? { auth } : {})
        }
      });
      updatedPushSubscriptions += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        updatedAccounts,
        updatedBankConnections,
        updatedPushSubscriptions
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
