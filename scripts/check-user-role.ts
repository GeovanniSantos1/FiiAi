import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando usuários no banco de dados...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  console.log(`Total de usuários: ${users.length}\n`);

  users.forEach((user) => {
    console.log(`User: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email || 'N/A'}`);
    console.log(`  Clerk ID: ${user.clerkId}`);
    console.log(`  Role: ${user.role || 'USER'}`);
    console.log(`  Active: ${user.isActive}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Erro ao buscar usuários:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
