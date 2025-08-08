import { PrismaClient } from '@prisma/client';
import { encryptEmail, hashEmail } from '../../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, emailEncrypted: true } });
  for (const user of users) {
    if (!user.emailEncrypted) continue;
    const encrypted = encryptEmail(user.emailEncrypted);
    const hash = hashEmail(user.emailEncrypted);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailEncrypted: encrypted, emailHash: hash },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
