import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 定义更新活动的验证模式
const eventUpdateSchema = z.object({
  title: z.string().min(1, '活动标题不能为空'),
  date: z.string().min(1, '活动日期不能为空'),
  location: z.string().min(1, '活动地点不能为空'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

// 获取单个活动详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 获取当前用户（如果已登录）
    const currentUser = await requireAuth(request);
    
    // 查询活动详情
    const event = await prisma.events.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: '未找到该活动' },
        { status: 404 }
      );
    }
    
    // 格式化响应数据
    const formattedEvent = {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      description: event.description,
      image_url: event.image_url,
      created_at: event.created_at.toISOString(),
      organizer: {
        id: event.organizer.id,
        name: event.organizer.name,
      },
      registrations: event.registrations.map(reg => ({
        id: reg.id,
        user: {
          id: reg.user.id,
          name: reg.user.name,
          email: reg.user.email,
        },
        status: reg.status,
        created_at: reg.created_at.toISOString(),
      })),
      total_registrations: event.registrations.length,
      current_user_registered: currentUser ? 
        event.registrations.some(reg => reg.user_id === currentUser.id) : 
        false,
      is_admin: currentUser?.role === 'admin',
    };
    
    return NextResponse.json({ event: formattedEvent });
  } catch (error) {
    console.error('获取活动详情失败:', error);
    return NextResponse.json(
      { error: '获取活动详情失败' },
      { status: 500 }
    );
  }
}

// 更新活动信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证用户身份和权限
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能更新活动' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以更新活动' },
        { status: 403 }
      );
    }
    
    // 检查活动是否存在
    const existingEvent = await prisma.events.findUnique({
      where: { id },
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: '未找到该活动' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const validation = eventUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '表单数据验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { title, date, location, description, image_url } = validation.data;
    
    // 更新活动
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: {
        title,
        date: new Date(date),
        location,
        description: description || '',
        image_url: image_url || '',
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // 格式化响应数据
    const formattedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      date: updatedEvent.date.toISOString(),
      location: updatedEvent.location,
      description: updatedEvent.description,
      image_url: updatedEvent.image_url,
      created_at: updatedEvent.created_at.toISOString(),
      organizer_id: updatedEvent.organizer.id,
      organizer_name: updatedEvent.organizer.name,
    };
    
    return NextResponse.json({ 
      message: '活动更新成功',
      event: formattedEvent 
    });
  } catch (error) {
    console.error('更新活动失败:', error);
    return NextResponse.json(
      { error: '更新活动失败，请稍后再试' },
      { status: 500 }
    );
  }
}

// 删除活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证用户身份和权限
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能删除活动' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以删除活动' },
        { status: 403 }
      );
    }
    
    // 检查活动是否存在
    const existingEvent = await prisma.events.findUnique({
      where: { id },
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: '未找到该活动' },
        { status: 404 }
      );
    }
    
    // 删除所有相关的注册记录
    await prisma.event_registrations.deleteMany({
      where: { event_id: id },
    });
    
    // 删除活动
    await prisma.events.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      message: '活动已成功删除'
    });
  } catch (error) {
    console.error('删除活动失败:', error);
    return NextResponse.json(
      { error: '删除活动失败，请稍后再试' },
      { status: 500 }
    );
  }
} 