import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { put } from '@vercel/blob';

// 定义说说验证模式
const postSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
});

// 获取说说列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能查看说说' },
        { status: 401 }
      );
    }
    
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const total = await prisma.posts.count();
    
    // 获取所有说说，按时间降序排列，包含作者和点赞信息
    const posts = await prisma.posts.findMany({
      skip,
      take: pageSize,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            id: true,
            user_id: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            created_at: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            created_at: 'asc',
          },
          take: 3, // 只返回前3条评论
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
    
    // 格式化响应数据
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_urls: post.image_urls,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.name,
      },
      is_liked: post.likes.some(like => like.user_id === user.id),
      likes_count: post._count.likes,
      comments_count: post._count.comments,
      // 返回前3条评论预览
      comments_preview: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at.toISOString(),
        author: {
          id: comment.user.id,
          name: comment.user.name,
        },
      })),
    }));
    
    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取说说失败:', error);
    return NextResponse.json(
      { error: '获取说说列表失败' },
      { status: 500 }
    );
  }
}

// 发布新说说
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能发布说说' },
        { status: 401 }
      );
    }
    
    // 解析请求体
    const formData = await request.formData();
    
    // 获取图片文件
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: string[] = [];
    
    // 如果有图片文件，上传到 Vercel Blob
    if (imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        const blob = await put(imageFile.name, imageFile, {
          access: 'public',
        });
        imageUrls.push(blob.url);
      }
    }
    
    // 获取文本内容
    const content = formData.get('content') as string;
    
    // 验证请求数据
    const validation = postSchema.safeParse({ content });
    if (!validation.success) {
      return NextResponse.json(
        { error: '表单数据验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // 创建新说说
    const post = await prisma.posts.create({
      data: {
        content: validation.data.content,
        image_urls: imageUrls,
        author_id: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // 格式化响应数据
    const formattedPost = {
      id: post.id,
      content: post.content,
      image_urls: post.image_urls,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.name,
      },
      is_liked: false,
      likes_count: 0,
      comments_count: 0,
      comments_preview: [],
    };
    
    return NextResponse.json({
      message: '发布说说成功',
      post: formattedPost,
    }, { status: 201 });
  } catch (error) {
    console.error('发布说说失败:', error);
    return NextResponse.json(
      { error: '发布说说失败，请稍后再试' },
      { status: 500 }
    );
  }
} 