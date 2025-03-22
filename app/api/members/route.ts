import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { fetchUsers } from '@/app/lib/data';
import { verifyToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// 获取所有成员
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
    
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: '无效的登录凭证' },
        { status: 401 }
      );
    }

    // 获取所有成员
    const users = await fetchUsers();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    return NextResponse.json(
      { error: '获取成员列表失败' },
      { status: 500 }
    );
  }
}

// 创建新成员
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

    // 解析请求数据
    const body = await request.json();
    const { name, email, password } = body;

    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '名称、邮箱和密码为必填项' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被使用
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被使用' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新成员
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // 清除敏感信息
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      user: userWithoutPassword,
      message: '成员创建成功'
    }, { status: 201 });
  } catch (error) {
    console.error('创建成员失败:', error);
    return NextResponse.json(
      { error: '创建成员失败' },
      { status: 500 }
    );
  }
} 