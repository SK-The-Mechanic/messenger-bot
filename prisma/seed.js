const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.servicePricing.createMany({
        data: [
            {
                category: 'Website',
                subType: null,
                techStack: 'MERN',
                minPriceBDT: 40000,
                maxPriceBDT: 50000,
                minPriceUSD: 500,
                maxPriceUSD: 750,
                notes: 'Basic business/portfolio site',
            },
            {
                category: 'App',
                subType: 'E-commerce App',
                techStack: 'React Native',
                minPriceBDT: 80000,
                maxPriceBDT: 150000,
                minPriceUSD: 1000,
                maxPriceUSD: 1800,
                notes: null,
            },
            {
                category: 'App',
                subType: 'Health App',
                techStack: 'React Native',
                minPriceBDT: 90000,
                maxPriceBDT: 160000,
                minPriceUSD: 1100,
                maxPriceUSD: 1900,
                notes: null,
            },
            {
                category: 'App',
                subType: 'Food Delivery App',
                techStack: 'React Native',
                minPriceBDT: 100000,
                maxPriceBDT: 200000,
                minPriceUSD: 1200,
                maxPriceUSD: 2400,
                notes: 'Live tracking/navigation like Foodpanda',
            },
        ],
    });

    await prisma.unsupportedTech.createMany({
        data: [
            { name: 'Laravel' },
            { name: 'PHP' },
            { name: 'WordPress' },
        ],
    });

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });