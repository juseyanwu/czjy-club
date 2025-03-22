import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    // 解析请求体
    const { name, email, password } = await request.json();

    // 验证请求数据
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: '请提供所有必填字段' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.users.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 密码加密
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // 检查是否是第一个用户（第一个用户设置为管理员）
    const userCount = await prisma.users.count();
    const isFirstUser = userCount === 0;

    // 创建用户
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'admin' : 'user', // 第一个注册的用户设为管理员，其他设为普通用户
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // 返回成功响应（不包含密码）
    return NextResponse.json({
      message: '注册成功',
      user: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}