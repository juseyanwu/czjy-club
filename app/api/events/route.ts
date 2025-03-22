import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const events = await prisma.events.findMany({
      include: {
        organizer: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // 转换为前端所需格式
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      location: event.location,
      description: event.description || '',
      image_url: event.image_url || '',
      created_at: event.created_at ? event.created_at.toISOString() : '',
      organizer_name: event.organizer.name,
      organizer_id: event.organizer_id || ''
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 创建新活动
export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: '请先登录' },
        { status: 401 }
      );
    }
    
    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { message: '无效的登录凭证' },
        { status: 401 }
      );
    }
    
    // 验证用户是否为管理员
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: '只有管理员可以创建活动' },
        { status: 403 }
      );
    }

    // 解析请求体
    const { title, date, location, description, image_url } = await request.json();

    // 验证请求数据
    if (!title || !date || !location) {
      return NextResponse.json(
        { message: '请提供所有必填字段' },
        { status: 400 }
      );
    }

    // 创建活动（使用当前管理员作为组织者）
    const newEvent = await prisma.events.create({
      data: {
        title,
        date: new Date(date),
        location,
        description,
        image_url,
        organizer_id: currentUser.id // 使用当前登录的管理员ID
      },
      include: {
        organizer: {
          select: {
            name: true
          }
        }
      }
    });

    // 格式化响应数据
    const formattedEvent = {
      ...newEvent,
      date: newEvent.date.toISOString().split('T')[0],
      created_at: newEvent.created_at ? newEvent.created_at.toISOString() : null,
      organizer_name: newEvent.organizer.name
    };

    // 返回成功响应
    return NextResponse.json({
      message: '活动创建成功',
      event: formattedEvent
    }, { status: 201 });

  } catch (error) {
    console.error('创建活动错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}