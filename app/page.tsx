'use client';

import { UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { lusitana, inter } from "@/app/ui/fonts";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getClientUser, logoutUser } from "@/app/lib/auth";
import { useRouter } from "next/navigation";

// 校园社团管理系统主页
export default function Page() {
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const router = useRouter();
  
  // 获取当前用户
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getClientUser();
      setCurrentUser(user);
    };
    
    fetchUser();
  }, []);
  
  // 处理退出登录
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const success = await logoutUser();
      
      if (success) {
        // 清除当前用户状态
        setCurrentUser(null);
        // 刷新页面以确保所有状态都被重置
        router.refresh();
      } else {
        console.error('退出登录失败');
      }
    } catch (error) {
      console.error('退出登录错误:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col">
      {/* 顶部导航栏 */}
      <nav className="flex h-16 items-center justify-between px-6 bg-gray-50 shadow-lg">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-blue-600 mr-2" />
          <span className={`${lusitana.className} text-xl font-bold text-blue-600`}>校园社团管理系统</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">首页</Link>
          <Link href="/clubs" className="text-gray-700 hover:text-blue-600 font-medium">社团</Link>
          <Link href="/events" className="text-gray-700 hover:text-blue-600 font-medium">活动</Link>
          <Link href="/tasks" className="text-gray-700 hover:text-blue-600 font-medium">任务</Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">数据分析</Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">消息</Link>
          {currentUser ? (
            <div className="flex items-center">
              <div className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium mr-3">
                {currentUser.name}
              </div>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoggingOut ? '退出中...' : '退出登录'}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              登录
            </Link>
          )}
        </div>
      </nav>

      {/* 主要内容区 - 蓝色背景 */}
      <div className="flex flex-col md:flex-row bg-gradient-to-r from-blue-100 to-blue-500 text-white flex-grow flex-1 items-center">
        {/* 左侧信息区 */}
        <div className="flex flex-col justify-center px-6 py-10 md:w-1/2 md:px-20">
          <h1 className={`${lusitana.className} text-4xl text-black md:text-5xl font-bold mb-6`}>
            智能化校园社团<br />管理平台
          </h1>
          
          <p className={`${inter.className} text-lg md:text-xl mb-8 ml-2 text-black`}>
            全方位社团管理解决方案，提升社团活力，促进校园文化建设
          </p>
          
          {/* 功能按钮区 */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 md:text-lg"
              >
                <span>进入控制台</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 md:text-lg"
              >
                <span>立即体验</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* 右侧图片展示区 */}
        <div className="flex items-center justify-center p-6 md:w-1/2 md:p-12">
          <Image 
            src="/home.png" 
            alt="校园社团管理系统" 
            width={560} 
            height={370}
            className="rounded-2xl" // 添加圆角样式
          />
        </div>
      </div>
    </main>
  );
}
