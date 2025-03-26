import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 获取活动的所有报名者
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // 验证用户身份，确保是管理员
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能查看报名列表' },
        { status: 401 }
      );
    }
    
    // 验证是否为管理员
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以查看报名列表' },
        { status: 403 }
      );
    }
    
    // 检查活动是否存在
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: '未找到该活动' },
        { status: 404 }
      );
    }
    
    // 获取所有报名信息，并包含用户信息
    const registrations = await prisma.event_registrations.findMany({
      where: {
        event_id: eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    
    // 格式化返回数据
    const formattedRegistrations = registrations.map(reg => ({
      id: reg.id,
      status: reg.status,
      createdAt: reg.created_at.toISOString(),
      user: {
        id: reg.user.id,
        name: reg.user.name,
        email: reg.user.email,
      },
    }));
    
    return NextResponse.json({
      count: formattedRegistrations.length,
      registrations: formattedRegistrations,
    });
    
  } catch (error) {
    console.error('获取报名列表失败:', error);
    return NextResponse.json(
      { error: '获取报名列表失败，请稍后再试' },
      { status: 500 }
    );
  }
} 