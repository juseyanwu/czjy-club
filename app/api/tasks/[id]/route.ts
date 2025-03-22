import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';

// 获取单个任务详情
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
    
    // 查询任务
    const task = await prisma.tasks.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        logs: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }
    
    // 格式化任务数据
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      location: task.location,
      due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null,
      status: task.status,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
      creator_id: task.creator_id,
      creator_name: task.creator.name,
      creator_email: task.creator.email,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee?.name || null,
      assignee_email: task.assignee?.email || null,
      comments: task.comments.map(comment => ({
        id: comment.id,
        task_id: comment.task_id,
        user_id: comment.user_id,
        user_name: comment.user.name,
        content: comment.content,
        created_at: comment.created_at.toISOString()
      })),
      logs: task.logs.map(log => ({
        id: log.id,
        task_id: log.task_id,
        user_id: log.user_id,
        user_name: log.user.name,
        old_status: log.old_status,
        new_status: log.new_status,
        message: log.message,
        created_at: log.created_at.toISOString()
      }))
    };
    
    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('获取任务详情错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 更新任务
export async function PUT(
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
    
    const taskId = params.id;
    
    // 查询现有任务
    const existingTask = await prisma.tasks.findUnique({
      where: { id: taskId }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }
    
    // 检查权限：只有管理员、任务创建者或被指派人可以更新任务
    const canUpdate = 
      currentUser.role === 'admin' || 
      existingTask.creator_id === currentUser.id ||
      existingTask.assignee_id === currentUser.id;
      
    if (!canUpdate) {
      return NextResponse.json(
        { error: '您没有权限更新此任务' },
        { status: 403 }
      );
    }
    
    // 解析请求体
    const { title, description, location, due_date, assignee_id, status } = await request.json();
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    
    // 只有管理员可以更改指派人
    if (assignee_id !== undefined && currentUser.role === 'admin') {
      // 检查被指派人是否存在
      if (assignee_id) {
        const assignee = await prisma.users.findUnique({
          where: { id: assignee_id }
        });
        
        if (!assignee) {
          return NextResponse.json(
            { error: '指定的成员不存在' },
            { status: 400 }
          );
        }
      }
      
      updateData.assignee_id = assignee_id;
    }
    
    // 处理状态变更
    let statusChanged = false;
    let oldStatus = null;
    
    if (status !== undefined && status !== existingTask.status) {
      updateData.status = status;
      statusChanged = true;
      oldStatus = existingTask.status;
    }
    
    // 更新任务
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: {
          select: {
            name: true
          }
        },
        assignee: {
          select: {
            name: true
          }
        }
      }
    });
    
    // 如果状态发生了变化，记录日志
    if (statusChanged) {
      await prisma.task_logs.create({
        data: {
          task_id: taskId,
          user_id: currentUser.id,
          old_status: oldStatus,
          new_status: status,
          message: `任务状态从 ${getStatusText(oldStatus)} 变更为 ${getStatusText(status)}`
        }
      });
    }
    
    // 格式化响应数据
    const formattedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      location: updatedTask.location,
      due_date: updatedTask.due_date ? updatedTask.due_date.toISOString().split('T')[0] : null,
      status: updatedTask.status,
      created_at: updatedTask.created_at.toISOString(),
      updated_at: updatedTask.updated_at.toISOString(),
      creator_id: updatedTask.creator_id,
      creator_name: updatedTask.creator.name,
      assignee_id: updatedTask.assignee_id,
      assignee_name: updatedTask.assignee?.name || null
    };
    
    return NextResponse.json({
      message: '任务更新成功',
      task: formattedTask
    });
  } catch (error) {
    console.error('更新任务错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 删除任务
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
    
    // 只有管理员和任务创建者可以删除任务
    if (currentUser.role !== 'admin') {
      const task = await prisma.tasks.findUnique({
        where: { id: params.id },
        select: { creator_id: true }
      });
      
      if (!task) {
        return NextResponse.json(
          { error: '任务不存在' },
          { status: 404 }
        );
      }
      
      if (task.creator_id !== currentUser.id) {
        return NextResponse.json(
          { error: '您没有权限删除此任务' },
          { status: 403 }
        );
      }
    }
    
    // 删除任务（级联删除评论和日志）
    await prisma.tasks.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({
      message: '任务删除成功'
    });
  } catch (error) {
    console.error('删除任务错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 辅助函数：获取状态文本描述
function getStatusText(status: string | null): string {
  switch (status) {
    case 'NOT_STARTED':
      return '未开始';
    case 'IN_PROGRESS':
      return '进行中';
    case 'COMPLETED':
      return '已完成';
    default:
      return '未知状态';
  }
} 