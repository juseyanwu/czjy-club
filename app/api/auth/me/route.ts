import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 获取当前登录用户
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    // 返回用户信息
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return NextResponse.json(
      { message: "服务器错误，请稍后再试" },
      { status: 500 }
    );
  }
}
