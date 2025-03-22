import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// 用户报名参加活动
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户是否已登录
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: '无效的登录凭证' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    
    // 检查活动是否存在
    const event = await prisma.events.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: '活动不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户是否已报名
    const existingRegistration = await prisma.event_registrations.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: currentUser.id
        }
      }
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { error: '您已经报名参加了此活动' },
        { status: 400 }
      );
    }
    
    // 创建报名记录
    const registration = await prisma.event_registrations.create({
      data: {
        event_id: eventId,
        user_id: currentUser.id,
        status: 'registered'
      }
    });
    
    return NextResponse.json({
      message: '报名成功',
      registration
    });
    
  } catch (error) {
    console.error('活动报名失败:', error);
    return NextResponse.json(
      { error: '活动报名失败' },
      { status: 500 }
    );
  }
}

// 取消报名
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户是否已登录
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: '无效的登录凭证' },
        { status: 401 }
      );
    }
    
    const eventId = params.id;
    
    // 检查报名记录是否存在
    const registration = await prisma.event_registrations.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: currentUser.id
        }
      }
    });
    
    if (!registration) {
      return NextResponse.json(
        { error: '您尚未报名参加此活动' },
        { status: 404 }
      );
    }
    
    // 删除报名记录
    await prisma.event_registrations.delete({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: currentUser.id
        }
      }
    });
    
    return NextResponse.json({
      message: '取消报名成功'
    });
    
  } catch (error) {
    console.error('取消报名失败:', error);
    return NextResponse.json(
      { error: '取消报名失败' },
      { status: 500 }
    );
  }
} 