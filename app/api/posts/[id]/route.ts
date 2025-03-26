import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 定义更新说说验证模式
const updatePostSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
});

// 获取单个说说详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能查看说说详情' },
        { status: 401 }
      );
    }
    
    // 获取说说详情
    const post = await prisma.posts.findUnique({
      where: { id },
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
            created_at: true,
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
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
    
    if (!post) {
      return NextResponse.json(
        { error: '找不到该说说' },
        { status: 404 }
      );
    }
    
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
      is_liked: post.likes.some(like => like.user_id === user.id),
      likes_count: post._count.likes,
      likes: post.likes.map(like => ({
        id: like.id,
        user_id: like.user_id,
        created_at: like.created_at.toISOString(),
      })),
      comments_count: post._count.comments,
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at.toISOString(),
        author: {
          id: comment.user.id,
          name: comment.user.name,
        },
      })),
    };
    
    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error('获取说说详情失败:', error);
    return NextResponse.json(
      { error: '获取说说详情失败' },
      { status: 500 }
    );
  }
}

// 更新说说
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能更新说说' },
        { status: 401 }
      );
    }
    
    // 检查说说是否存在及权限
    const existingPost = await prisma.posts.findUnique({
      where: { id },
      select: { author_id: true },
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { error: '找不到该说说' },
        { status: 404 }
      );
    }
    
    // 检查是否是作者本人或管理员
    if (existingPost.author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: '没有权限更新该说说' },
        { status: 403 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const validation = updatePostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '表单数据验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // 更新说说
    const updatedPost = await prisma.posts.update({
      where: { id },
      data: {
        content: validation.data.content,
        updated_at: new Date(),
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
      id: updatedPost.id,
      content: updatedPost.content,
      image_urls: updatedPost.image_urls,
      created_at: updatedPost.created_at.toISOString(),
      updated_at: updatedPost.updated_at.toISOString(),
      author: {
        id: updatedPost.author.id,
        name: updatedPost.author.name,
      },
    };
    
    return NextResponse.json({
      message: '更新说说成功',
      post: formattedPost,
    });
  } catch (error) {
    console.error('更新说说失败:', error);
    return NextResponse.json(
      { error: '更新说说失败，请稍后再试' },
      { status: 500 }
    );
  }
}

// 删除说说
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能删除说说' },
        { status: 401 }
      );
    }
    
    // 检查说说是否存在及权限
    const existingPost = await prisma.posts.findUnique({
      where: { id },
      select: { author_id: true },
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { error: '找不到该说说' },
        { status: 404 }
      );
    }
    
    // 检查是否是作者本人或管理员
    if (existingPost.author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: '没有权限删除该说说' },
        { status: 403 }
      );
    }
    
    // 删除说说 (会级联删除相关的点赞和评论)
    await prisma.posts.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: '删除说说成功',
    });
  } catch (error) {
    console.error('删除说说失败:', error);
    return NextResponse.json(
      { error: '删除说说失败，请稍后再试' },
      { status: 500 }
    );
  }
} 