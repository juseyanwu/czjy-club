import { PrismaClient } from '@prisma/client';

// 添加全局类型声明，避免使用@ts-ignore
declare global {
  var prisma: PrismaClient | undefined;
}

// 创建或复用Prisma客户端实例
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });

// 在开发环境中将prisma实例保存到全局对象中以避免热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;