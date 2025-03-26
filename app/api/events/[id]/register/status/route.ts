import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 获取用户的报名状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { registered: false, error: '用户未登录' },
        { status: 401 }
      );
    }
    
    // 检查活动是否存在
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { registered: false, error: '未找到该活动' },
        { status: 404 }
      );
    }
    
    // 检查用户是否已报名
    const registration = await prisma.event_registrations.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: user.id,
        },
      },
    });
    
    // 返回用户报名状态
    return NextResponse.json({
      registered: !!registration,
      registration: registration ? {
        id: registration.id,
        status: registration.status,
        createdAt: registration.created_at.toISOString(),
      } : null,
    });
    
  } catch (error) {
    console.error('获取报名状态失败:', error);
    return NextResponse.json(
      { registered: false, error: '获取报名状态失败，请稍后再试' },
      { status: 500 }
    );
  }
} 