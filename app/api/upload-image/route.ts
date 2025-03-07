import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: '只允许上传图片文件' },
        { status: 400 }
      );
    }

    // 上传到Vercel Blob Storage
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // 返回成功响应
    return NextResponse.json({
      message: '图片上传成功',
      url: blob.url
    });

  } catch (error) {
    console.error('图片上传错误:', error);
    return NextResponse.json(
      { message: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}