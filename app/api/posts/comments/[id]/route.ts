import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能删除评论' },
        { status: 401 }
      );
    }
    
    // 检查评论是否存在
    const comment = await prisma.post_comments.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        post_id: true,
        user_id: true,
        post: {
          select: {
            author_id: true,
          },
        },
      },
    });
    
    if (!comment) {
      return NextResponse.json(
        { error: '找不到该评论' },
        { status: 404 }
      );
    }
    
    // 检查权限：只有评论作者、说说作者或管理员可以删除评论
    if (
      comment.user_id !== user.id && 
      comment.post.author_id !== user.id && 
      user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: '没有权限删除该评论' },
        { status: 403 }
      );
    }
    
    // 删除评论
    await prisma.post_comments.delete({
      where: { id: commentId },
    });
    
    // 获取更新后的评论数量
    const commentsCount = await prisma.post_comments.count({
      where: { post_id: comment.post_id },
    });
    
    return NextResponse.json({
      message: '评论删除成功',
      post_id: comment.post_id,
      comments_count: commentsCount,
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json(
      { error: '删除评论失败，请稍后再试' },
      { status: 500 }
    );
  }
} 