
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@calmagest.com';
    const password = 'calma';
    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Usuario Demo',
            passwordHash: hashedPassword,
            currency: 'EUR',
            timezone: 'Europe/Madrid',
            defaultBudget: 150000, // 1500.00
            defaultIncome: 200000, // 2000.00
        },
    });

    console.log({ user });

    // Create initial month
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const month = await prisma.month.upsert({
        where: {
            userId_yearMonth: {
                userId: user.id,
                yearMonth,
            },
        },
        update: {},
        create: {
            userId: user.id,
            yearMonth,
            budget: user.defaultBudget,
            income: user.defaultIncome,
        },
    });

    console.log({ month });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
