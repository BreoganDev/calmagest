
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'diegofernandezgoas@gmail.com';
    const password = '@Rosdeli979';
    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword, // Ensure password is set if user exists
        },
        create: {
            email,
            name: 'Diego Fernandez',
            passwordHash: hashedPassword,
            currency: 'EUR',
            timezone: 'Europe/Madrid',
            defaultBudget: 150000,
            defaultIncome: 200000,
        },
    });

    console.log('User created/updated:', user);

    // Ensure initial month exists
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

    console.log('Month initialized:', month);
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
