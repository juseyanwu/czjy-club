import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { fetchUserById } from '@/app/lib/data';
import { verifyToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// 获取指定成员详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 解析参数
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // 获取用户详情
    const user = await fetchUserById(id);
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取成员详情失败:', error);
    return NextResponse.json(
      { error: '获取成员详情失败' },
      { status: 500 }
    );
  }
}

// 更新成员信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 解析参数
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { name, email, password } = body;

    // 验证用户是否存在
    const existingUser = await prisma.users.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '成员不存在' },
        { status: 404 }
      );
    }

    // 准备更新数据
    const updateData: Record<string, unknown> = {};
    
    if (name) updateData.name = name;
    
    if (email && email !== existingUser.email) {
      // 检查邮箱是否已被其他用户使用
      const emailExists = await prisma.users.findUnique({
        where: { email }
      });

      if (emailExists && emailExists.id !== id) {
        return NextResponse.json(
          { error: '该邮箱已被使用' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    if (password) {
      // 加密新密码
      updateData.password = await bcrypt.hash(password, 10);
    }

    // 更新用户信息
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData
    });

    // 清除敏感信息
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      user: userWithoutPassword,
      message: '成员信息更新成功'
    });
  } catch (error) {
    console.error('更新成员信息失败:', error);
    return NextResponse.json(
      { error: '更新成员信息失败' },
      { status: 500 }
    );
  }
}

// 删除成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 解析参数
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 验证用户是否存在
    const existingUser = await prisma.users.findUnique({
      where: { id },
      include: {
        events: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '成员不存在' },
        { status: 404 }
      );
    }

    // 检查是否有关联的活动
    if (existingUser.events.length > 0) {
      return NextResponse.json(
        { error: '该成员有关联的活动，无法删除' },
        { status: 400 }
      );
    }

    // 删除用户
    await prisma.users.delete({
      where: { id }
    });

    return NextResponse.json({
      message: '成员删除成功'
    });
  } catch (error) {
    console.error('删除成员失败:', error);
    return NextResponse.json(
      { error: '删除成员失败' },
      { status: 500 }
    );
  }
} 