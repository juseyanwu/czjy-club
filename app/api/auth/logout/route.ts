import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // 获取cookie存储对象
    const cookieStore = cookies();
    
    // 清除token cookie
    cookieStore.delete('token');
    
    // 返回成功响应
    return NextResponse.json({ message: "退出登录成功" });
  } catch (error) {
    console.error("退出登录错误:", error);
    return NextResponse.json(
      { message: "服务器错误，请稍后再试" },
      { status: 500 }
    );
  }
} 