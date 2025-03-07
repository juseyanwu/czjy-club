import { NextResponse } from 'next/server';
import postgres from 'postgres';

// 数据库连接
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 获取活动列表
export async function GET() {
  try {
    const events = await sql`
      SELECT 
        events.id,
        events.title,
        events.date,
        events.location,
        events.description,
        users.name as organizer_name,
        events.created_at
      FROM events
      JOIN users ON events.organizer_id = users.id
      ORDER BY events.date DESC
    `;
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('获取活动列表错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 创建新活动
export async function POST(request: Request) {
  try {
    // 解析请求体
    const { title, date, location, description, organizer_id } = await request.json();

    // 验证请求数据
    if (!title || !date || !location || !organizer_id) {
      return NextResponse.json(
        { message: '请提供所有必填字段' },
        { status: 400 }
      );
    }

    // 创建活动
    const newEvent = await sql`
      INSERT INTO events (title, date, location, description, organizer_id)
      VALUES (${title}, ${date}, ${location}, ${description}, ${organizer_id})
      RETURNING id, title, date, location, description, organizer_id, created_at
    `;

    // 返回成功响应
    return NextResponse.json({
      message: '活动创建成功',
      event: newEvent[0]
    }, { status: 201 });

  } catch (error) {
    console.error('创建活动错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}