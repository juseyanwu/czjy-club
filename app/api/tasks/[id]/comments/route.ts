import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// 获取任务评论列表
export async function GET(
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
    
    // 检查任务是否存在
    const task = await prisma.tasks.findUnique({
      where: { id: params.id }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }
    
    // 获取任务评论
    const comments = await prisma.task_comments.findMany({
      where: { task_id: params.id },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });
    
    // 格式化评论数据
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      task_id: comment.task_id,
      user_id: comment.user_id,
      user_name: comment.user.name,
      content: comment.content,
      created_at: comment.created_at.toISOString()
    }));
    
    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error('获取任务评论错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 添加任务评论
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
    
    // 检查任务是否存在
    const task = await prisma.tasks.findUnique({
      where: { id: params.id }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const { content } = await request.json();
    
    // 验证请求数据
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: '评论内容不能为空' },
        { status: 400 }
      );
    }
    
    // 创建评论
    const comment = await prisma.task_comments.create({
      data: {
        task_id: params.id,
        user_id: currentUser.id,
        content: content.trim()
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
    
    // 格式化响应数据
    const formattedComment = {
      id: comment.id,
      task_id: comment.task_id,
      user_id: comment.user_id,
      user_name: comment.user.name,
      content: comment.content,
      created_at: comment.created_at.toISOString()
    };
    
    return NextResponse.json({
      message: '评论添加成功',
      comment: formattedComment
    }, { status: 201 });
  } catch (error) {
    console.error('添加任务评论错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
} 