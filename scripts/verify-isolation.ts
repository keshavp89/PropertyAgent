import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import assert from "node:assert/strict";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: true } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const orgA = "11111111-1111-4111-8111-111111111111";
const orgB = "22222222-2222-4222-8222-222222222222";
const user = "33333333-3333-4333-8333-333333333333";

async function main() {
  await prisma.property.deleteMany({ where: { organizationId: { in: [orgA, orgB] } } });
  await prisma.property.create({
    data: {
      organizationId: orgA,
      title: "Isolation A",
      propertyType: "APARTMENT",
      intent: "SALE",
      priceInr: 100,
      city: "Pune",
      locality: "Camp",
      description: "Tenant isolation fixture A for the brokerage desk.",
      listedByUserId: user,
    },
  });
  await prisma.property.create({
    data: {
      organizationId: orgB,
      title: "Isolation B",
      propertyType: "HOUSE",
      intent: "RENT",
      priceInr: 200,
      city: "Pune",
      locality: "Camp",
      description: "Tenant isolation fixture B for the brokerage desk.",
      listedByUserId: user,
    },
  });
  const visible = await prisma.property.findMany({ where: { organizationId: orgA }, select: { title: true, organizationId: true } });
  assert.deepEqual(visible.map((row) => row.title), ["Isolation A"]);
  assert.equal(visible.every((row) => row.organizationId === orgA), true);
  const leaked = await prisma.property.findFirst({ where: { organizationId: orgA, title: "Isolation B" } });
  assert.equal(leaked, null);
  await prisma.property.deleteMany({ where: { organizationId: { in: [orgA, orgB] } } });
  console.log("Tenant queries stay inside the brokerage.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
