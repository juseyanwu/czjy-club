import bcrypt from 'bcryptjs';
import { users } from '../lib/placeholder-data';
import { prisma } from '@/app/lib/prisma';

async function seedUsers() {
  // 确保用户表存在
  for (const user of users) {
    // 检查用户是否已存在
    const existingUser = await prisma.users.findUnique({
      where: {
        email: user.email,
      }
    });

    if (!existingUser) {
      // 创建用户
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.users.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword
        }
      });
    }
  }

  return users.length;
}

// 使用 Prisma 初始化活动表
async function seedEvents() {
  // 由于Prisma会自动创建表，这里不需要额外创建表的操作
  // 我们可以在这里添加示例活动数据
  return 0;
}

export async function GET() {
  try {
    const usersCount = await seedUsers();
    const eventsCount = await seedEvents();
    
    return Response.json({ 
      message: 'Database seeded successfully',
      usersCount,
      eventsCount
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
