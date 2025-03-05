import { NextResponse } from 'next/server';
import postgres from 'postgres';
import bcryptjs from 'bcryptjs';

// 数据库连接
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

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
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 密码加密
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // 创建用户
    const newUser = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email
    `;

    // 返回成功响应（不包含密码）
    return NextResponse.json({
      message: '注册成功',
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}