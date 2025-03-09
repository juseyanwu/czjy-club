import { NextResponse } from 'next/server';
import postgres from 'postgres';
import bcryptjs from 'bcryptjs';
import { generateToken } from '@/app/lib/auth';
import { cookies } from 'next/headers';

// 数据库连接
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(request: Request) {
  try {
    // 解析请求体
    const { email, password } = await request.json();

    // 验证请求数据
    if (!email || !password) {
      return NextResponse.json(
        { message: '请提供邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const users = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { message: '邮箱或密码不正确' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 验证密码
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '邮箱或密码不正确' },
        { status: 401 }
      );
    }

        // 生成JWT令牌
        const token = generateToken({
          id: user.id,
          name: user.name,
          email: user.email
        });
        
        // 设置cookie
        (await
          // 设置cookie
          cookies()).set({
          name: 'token',
          value: token,
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60, // 7天
          sameSite: 'strict'
        });

    // 登录成功，返回用户信息（不包含密码）
    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}