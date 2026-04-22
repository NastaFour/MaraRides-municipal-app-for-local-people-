const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const r = await p.trip.updateMany({
    where: { status: { in: ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'] } },
    data: { status: 'CANCELLED' }
  });
  const r2 = await p.driver.updateMany({
    where: { status: { in: ['ONLINE', 'IN_TRIP'] } },
    data: { status: 'OFFLINE' }
  });
  console.log('Viajes cancelados:', r.count);
  console.log('Conductores reseteados:', r2.count);
  await p.$disconnect();
}
run();
