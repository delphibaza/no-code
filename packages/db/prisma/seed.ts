import prisma from "./client";

// Add plans
async function main() {
  await prisma.plan.createMany({
    data: [
      {
        type: "free",
        dailyTokenLimit: 150000, // 150K
        monthlyTokenLimit: 1000000, // 1M
        price: 0,
      },
      {
        type: "pro",
        dailyTokenLimit: 500000, // 500K
        monthlyTokenLimit: 5000000, // 5M
        price: 20,
      },
      {
        type: "enterprise",
        dailyTokenLimit: 1000000, // 1M
        monthlyTokenLimit: 10000000, // 10M
        price: 40,
      },
    ],
  });
}

main();
