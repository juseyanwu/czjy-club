import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// 点赞
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
        { error: '需要登录才能点赞' },
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
    
    // 检查是否已点赞
    const existingLike = await prisma.post_likes.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: user.id,
        },
      },
    });
    
    if (existingLike) {
      return NextResponse.json(
        { error: '您已经点赞过该说说' },
        { status: 400 }
      );
    }
    
    // 创建点赞记录
    const like = await prisma.post_likes.create({
      data: {
        post_id: postId,
        user_id: user.id,
      },
    });
    
    // 获取更新后的点赞数量
    const likesCount = await prisma.post_likes.count({
      where: { post_id: postId },
    });
    
    return NextResponse.json({
      message: '点赞成功',
      like: {
        id: like.id,
        post_id: like.post_id,
        user_id: like.user_id,
        created_at: like.created_at.toISOString(),
      },
      likes_count: likesCount,
    }, { status: 201 });
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json(
      { error: '点赞失败，请稍后再试' },
      { status: 500 }
    );
  }
}

// 取消点赞
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // 验证用户身份
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: '需要登录才能取消点赞' },
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
    
    // 检查是否已点赞
    const existingLike = await prisma.post_likes.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: user.id,
        },
      },
    });
    
    if (!existingLike) {
      return NextResponse.json(
        { error: '您还没有点赞该说说' },
        { status: 400 }
      );
    }
    
    // 删除点赞记录
    await prisma.post_likes.delete({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: user.id,
        },
      },
    });
    
    // 获取更新后的点赞数量
    const likesCount = await prisma.post_likes.count({
      where: { post_id: postId },
    });
    
    return NextResponse.json({
      message: '取消点赞成功',
      likes_count: likesCount,
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json(
      { error: '取消点赞失败，请稍后再试' },
      { status: 500 }
    );
  }
} 