import { PrismaClient } from "../../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração do Prisma com logging otimizado
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

// Note: $use middleware is deprecated in Prisma 5+
// Para monitorar queries lentas, use Prisma logging ou ferramentas externas como:
// - Prisma Accelerate
// - OpenTelemetry
// - Custom logging wrapper functions

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Alias for backwards compatibility
export const prisma = db;
