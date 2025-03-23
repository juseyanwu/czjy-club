// @ts-ignore
import { PrismaClient } from '@prisma/client';

// 全局变量类型定义
const globalForPrisma = global as unknown as { prisma: any };

// 创建Prisma客户端实例
export const prisma = globalForPrisma.prisma || new PrismaClient();

// 非生产环境下保存Prisma实例到全局对象
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;