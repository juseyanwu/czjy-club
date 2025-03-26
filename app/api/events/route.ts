import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { put } from '@vercel/blob';

// 定义创建活动的验证模式
const eventSchema = z.object({
  title: z.string().min(1, '活动标题不能为空'),
  date: z.string().min(1, '活动日期不能为空'),
  location: z.string().min(1, '活动地点不能为空'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

// 获取活动列表
export async function GET() {
  try {
    // 获取所有活动，按日期降序排列
    const events = await prisma.events.findMany({
      orderBy: {
        date: 'desc',
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        registrations: {
          select: {
            id: true,
            user_id: true,
          },
        },
      },
    });

    // 格式化响应数据
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      description: event.description,
      image_url: event.image_url,
      created_at: event.created_at.toISOString(),
      organizer_id: event.organizer.id,
      organizer_name: event.organizer.name,
      registrations: event.registrations,
      registration_count: event.registrations.length,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('获取活动失败:', error);
    return NextResponse.json(
      { error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}

// 创建新活动
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份和权限
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能创建活动' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以创建活动' },
        { status: 403 }
      );
    }
    
    // 解析请求体
    const formData = await request.formData();
    
    // 获取图片文件
    const imageFile = formData.get('image') as File;
    let imageUrl = '';
    
    // 如果有图片文件，上传到 Vercel Blob
    if (imageFile) {
      const blob = await put(imageFile.name, imageFile, {
        access: 'public',
      });
      imageUrl = blob.url;
    }
    
    // 获取其他表单数据
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;
    
    // 验证请求数据
    const validation = eventSchema.safeParse({
      title,
      date,
      location,
      description,
      image_url: imageUrl,
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: '表单数据验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { title: validatedTitle, date: validatedDate, location: validatedLocation, description: validatedDescription } = validation.data;
    
    // 创建新活动
    const event = await prisma.events.create({
      data: {
        title: validatedTitle,
        date: new Date(validatedDate),
        location: validatedLocation,
        description: validatedDescription || '',
        image_url: imageUrl || '',
        organizer_id: user.id,
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
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      description: event.description,
      image_url: event.image_url,
      created_at: event.created_at.toISOString(),
      organizer_id: event.organizer.id,
      organizer_name: event.organizer.name,
      registrations: [],
      registration_count: 0,
    };
    
    return NextResponse.json({ 
      message: '活动创建成功',
      event: formattedEvent 
    }, { status: 201 });
  } catch (error) {
    console.error('创建活动失败:', error);
    return NextResponse.json(
      { error: '创建活动失败，请稍后再试' },
      { status: 500 }
    );
  }
}