import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDefaultAdmin(): Promise<void> {
  const existingAdmin = await prisma.admin.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existingAdmin) {
    process.stdout.write(
      `[ADMIN] SUPER_ADMIN already exists: ${existingAdmin.username} (${existingAdmin.email})\n`
    );
    return;
  }

  const passwordHash = await bcrypt.hash('EZZIAdmin2026!', 12);

  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      email: 'admin@ezzi.trade',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  process.stdout.write(`[ADMIN] Created SUPER_ADMIN: ${admin.username} (${admin.email})\n`);
  process.stdout.write(`[ADMIN] Default password: EZZIAdmin2026!\n`);
  process.stdout.write(`[ADMIN] Change this password immediately after first login.\n`);
}

createDefaultAdmin()
  .then(() => {
    process.stdout.write('[ADMIN] Done.\n');
    process.exit(0);
  })
  .catch((error: unknown) => {
    process.stderr.write(`[ADMIN] Error: ${error}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
