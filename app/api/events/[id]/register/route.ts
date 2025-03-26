import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 用户报名参加活动
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能报名参加活动' },
        { status: 401 }
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
    
    // 检查活动是否已结束
    if (event.date < new Date()) {
      return NextResponse.json(
        { error: '活动已结束，无法报名' },
        { status: 400 }
      );
    }
    
    // 检查用户是否已报名
    const existingRegistration = await prisma.event_registrations.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: user.id,
        },
      },
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { error: '您已经报名参加此活动' },
        { status: 400 }
      );
    }
    
    // 创建新的报名记录
    const registration = await prisma.event_registrations.create({
      data: {
        user_id: user.id,
        event_id: eventId,
        status: 'registered'
      },
    });
    
    return NextResponse.json({
      message: '报名成功',
      registration: {
        id: registration.id,
        user_id: registration.user_id,
        event_id: registration.event_id,
        status: registration.status,
        created_at: registration.created_at.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('活动报名失败:', error);
    return NextResponse.json(
      { error: '报名失败，请稍后再试' },
      { status: 500 }
    );
  }
}

// 取消报名
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能取消报名' },
        { status: 401 }
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
    
    // 检查用户是否已报名
    const existingRegistration = await prisma.event_registrations.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: user.id,
        },
      },
    });
    
    if (!existingRegistration) {
      return NextResponse.json(
        { error: '您尚未报名参加此活动' },
        { status: 400 }
      );
    }
    
    // 删除报名记录
    await prisma.event_registrations.delete({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: user.id,
        },
      },
    });
    
    return NextResponse.json({
      message: '已成功取消报名',
    });
  } catch (error) {
    console.error('取消报名失败:', error);
    return NextResponse.json(
      { error: '取消报名失败，请稍后再试' },
      { status: 500 }
    );
  }
} 