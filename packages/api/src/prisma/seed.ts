import { PrismaClient, Role, DriverStatus, TripStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Admin ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '0000000000' },
    update: {},
    create: {
      name: 'Administrador Municipal',
      phone: '0000000000',
      email: 'admin@mototaxi.local',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin created: ${admin.name}`);

  // ── Clients ──────────────────────────────────────────────────────────────
  const clientPassword = await bcrypt.hash('cliente123', 10);
  const client1 = await prisma.user.upsert({
    where: { phone: '0414-1234567' },
    update: {},
    create: {
      name: 'María González',
      phone: '0414-1234567',
      password: clientPassword,
      role: Role.CLIENT,
    },
  });
  const client2 = await prisma.user.upsert({
    where: { phone: '0424-7654321' },
    update: {},
    create: {
      name: 'Carlos Rodríguez',
      phone: '0424-7654321',
      password: clientPassword,
      role: Role.CLIENT,
    },
  });
  console.log(`✅ Clients created: ${client1.name}, ${client2.name}`);

  // ── Drivers ──────────────────────────────────────────────────────────────
  const driverPassword = await bcrypt.hash('conductor123', 10);

  const driver1 = await prisma.driver.upsert({
    where: { phone: '0416-1111111' },
    update: {},
    create: {
      name: 'Pedro Hernández',
      phone: '0416-1111111',
      password: driverPassword,
      licenseNum: 'V-12345678',
      status: DriverStatus.ONLINE,
      isApproved: true,
      latitude: 10.4806,
      longitude: -66.9036,
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { phone: '0416-2222222' },
    update: {},
    create: {
      name: 'José Pérez',
      phone: '0416-2222222',
      password: driverPassword,
      licenseNum: 'V-87654321',
      status: DriverStatus.OFFLINE,
      isApproved: true,
      latitude: 10.4820,
      longitude: -66.9050,
    },
  });

  // Pending approval — cannot receive trips
  const driver3 = await prisma.driver.upsert({
    where: { phone: '0416-3333333' },
    update: {},
    create: {
      name: 'Luis Martínez',
      phone: '0416-3333333',
      password: driverPassword,
      licenseNum: 'V-11111111',
      status: DriverStatus.OFFLINE,
      isApproved: false,
    },
  });
  console.log(`✅ Drivers created: ${driver1.name}, ${driver2.name}, ${driver3.name} (pending)`);

  // ── Vehicles ─────────────────────────────────────────────────────────────
  await prisma.vehicle.upsert({
    where: { driverId: driver1.id },
    update: {},
    create: {
      plate: 'ABC-123',
      model: 'Honda CB 150',
      year: 2020,
      driverId: driver1.id,
    },
  });

  await prisma.vehicle.upsert({
    where: { driverId: driver2.id },
    update: {},
    create: {
      plate: 'XYZ-789',
      model: 'Yamaha YBR 125',
      year: 2019,
      driverId: driver2.id,
    },
  });
  console.log('✅ Vehicles created');

  // ── Sample Trips ──────────────────────────────────────────────────────────
  await prisma.trip.createMany({
    skipDuplicates: true,
    data: [
      {
        clientId: client1.id,
        driverId: driver1.id,
        originLat: 10.4806,
        originLng: -66.9036,
        destLat: 10.4890,
        destLng: -66.9100,
        originAddress: 'Plaza Bolívar',
        destAddress: 'Terminal de Pasajeros',
        status: TripStatus.COMPLETED,
        fare: 5.0,
        completedAt: new Date(),
      },
      {
        clientId: client2.id,
        driverId: driver2.id,
        originLat: 10.4850,
        originLng: -66.9070,
        destLat: 10.4780,
        destLng: -66.8990,
        originAddress: 'Mercado Municipal',
        destAddress: 'Hospital Central',
        status: TripStatus.COMPLETED,
        fare: 7.5,
        completedAt: new Date(),
      },
      {
        clientId: client1.id,
        originLat: 10.4900,
        originLng: -66.9120,
        destLat: 10.4810,
        destLng: -66.9040,
        originAddress: 'Liceo Andrés Bello',
        destAddress: 'Plaza Bolívar',
        status: TripStatus.CANCELLED,
      },
    ],
  });
  console.log('✅ Sample trips created');

  console.log('\n🚀 Seed complete!');
  console.log('   Admin:     phone=0000000000   / pass=admin123');
  console.log('   Client:    phone=0414-1234567 / pass=cliente123');
  console.log('   Driver:    phone=0416-1111111 / pass=conductor123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
