import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 定义评论验证模式
const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空'),
});

// 获取说说评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能查看评论' },
        { status: 401 }
      );
    }
    
    // 检查说说是否存在
    const post = await prisma.posts.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return NextResponse.json(
        { error: '找不到该说说' },
        { status: 404 }
      );
    }
    
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;
    
    // 获取总数
    const total = await prisma.post_comments.count({
      where: { post_id: postId },
    });
    
    // 获取评论列表
    const comments = await prisma.post_comments.findMany({
      where: { post_id: postId },
      skip,
      take: pageSize,
      orderBy: {
        created_at: 'asc', // 按时间升序排列
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // 格式化响应数据
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at.toISOString(),
      author: {
        id: comment.user.id,
        name: comment.user.name,
      },
    }));
    
    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return NextResponse.json(
      { error: '获取评论列表失败' },
      { status: 500 }
    );
  }
}

// 发表评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能发表评论' },
        { status: 401 }
      );
    }
    
    // 检查说说是否存在
    const post = await prisma.posts.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return NextResponse.json(
        { error: '找不到该说说' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const validation = commentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '表单数据验证失败', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // 创建评论
    const comment = await prisma.post_comments.create({
      data: {
        content: validation.data.content,
        post_id: postId,
        user_id: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // 获取更新后的评论数量
    const commentsCount = await prisma.post_comments.count({
      where: { post_id: postId },
    });
    
    // 格式化响应数据
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at.toISOString(),
      author: {
        id: comment.user.id,
        name: comment.user.name,
      },
    };
    
    return NextResponse.json({
      message: '评论发表成功',
      comment: formattedComment,
      comments_count: commentsCount,
    }, { status: 201 });
  } catch (error) {
    console.error('发表评论失败:', error);
    return NextResponse.json(
      { error: '发表评论失败，请稍后再试' },
      { status: 500 }
    );
  }
} 