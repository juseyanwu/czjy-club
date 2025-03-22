import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/auth';
import { Prisma } from '@prisma/client';
// 使用类型导入，确保不会在运行时导入
// import type { Prisma } from '@prisma/client';

// 获取任务列表
export async function GET(request: NextRequest) {
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
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    
    // 构建查询条件
    const whereClause: Prisma.tasksWhereInput = {};
    
    // 根据任务状态筛选
    if (status) {
      whereClause.status = status as Prisma.EnumTaskStatusFilter;
    }
    
    // 根据指派人筛选
    if (assignee === 'me') {
      whereClause.assignee_id = currentUser.id;
    } else if (assignee === 'created') {
      whereClause.creator_id = currentUser.id;
    }
    
    // 查询任务列表
    const tasks = await prisma.tasks.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
        { created_at: 'desc' }
      ]
    });
    
    // 格式化任务数据
    const formattedTasks = tasks.map(task => ({
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
      assignee_id: task.assignee_id,
      assignee_name: task.assignee?.name || null
    }));
    
    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 创建新任务
export async function POST(request: NextRequest) {
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
    
    // 验证用户是否为管理员
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '只有管理员可以创建任务' },
        { status: 403 }
      );
    }
    
    // 解析请求体
    const { title, description, location, due_date, assignee_id } = await request.json();
    
    // 验证请求数据
    if (!title) {
      return NextResponse.json(
        { error: '任务标题不能为空' },
        { status: 400 }
      );
    }
    
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
    
    // 创建任务
    const newTask = await prisma.tasks.create({
      data: {
        title,
        description,
        location,
        due_date: due_date ? new Date(due_date) : null,
        creator_id: currentUser.id,
        assignee_id,
        status: 'NOT_STARTED'
      },
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
    
    // 创建任务日志
    await prisma.task_logs.create({
      data: {
        task_id: newTask.id,
        user_id: currentUser.id,
        new_status: 'NOT_STARTED',
        message: '任务已创建'
      }
    });
    
    // 格式化响应数据
    const formattedTask = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      location: newTask.location,
      due_date: newTask.due_date ? newTask.due_date.toISOString().split('T')[0] : null,
      status: newTask.status,
      created_at: newTask.created_at.toISOString(),
      updated_at: newTask.updated_at.toISOString(),
      creator_id: newTask.creator_id,
      creator_name: newTask.creator.name,
      assignee_id: newTask.assignee_id,
      assignee_name: newTask.assignee?.name || null
    };
    
    return NextResponse.json({
      message: '任务创建成功',
      task: formattedTask
    }, { status: 201 });
  } catch (error) {
    console.error('创建任务错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
} 