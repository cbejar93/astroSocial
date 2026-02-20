import { PrismaClient } from '@prisma/client';
import { encryptEmail, hashEmail } from '../../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  const botEmail = 'astrobot@astrolounge.internal';
  const emailEncrypted = encryptEmail(botEmail);
  const emailHash = hashEmail(botEmail);

  const bot = await prisma.user.upsert({
    where: {
      provider_providerId: { provider: 'bot', providerId: 'astrobot-v1' },
    },
    create: {
      emailEncrypted,
      emailHash,
      name: 'AstroBot',
      username: 'astrobot',
      provider: 'bot',
      providerId: 'astrobot-v1',
      role: 'BOT',
      profileComplete: true,
      avatarUrl:
        'https://api.dicebear.com/7.x/bottts/svg?seed=astrobot&backgroundColor=1a1a2e',
    },
    update: {},
  });

  console.log(`AstroBot user ready.`);
  console.log(`BOT_USER_ID=${bot.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
