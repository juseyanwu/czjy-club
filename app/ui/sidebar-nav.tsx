'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  SparklesIcon,
  LockClosedIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { logoutUser } from '@/app/lib/auth';
import { useState } from 'react';

const links = [
  { name: '仪表板', href: '/dashboard', icon: HomeIcon },
  { name: '社团管理', href: '/clubs', icon: BuildingLibraryIcon },
  { name: '成员管理', href: '/members', icon: UsersIcon },
  { name: '活动管理', href: '/events', icon: CalendarIcon },
  { name: '任务管理', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: '社团说说', href: '/posts', icon: ChatBubbleLeftRightIcon },
  { name: '数据分析', href: '/analytics', icon: ChartBarIcon },
  { name: '在线沟通', href: '/communication', icon: ChatBubbleOvalLeftEllipsisIcon },
  { name: '智能推荐', href: '/recommendations', icon: SparklesIcon },
  { name: '权限设置', href: '/settings', icon: LockClosedIcon },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 处理退出登录
  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const success = await logoutUser();
      
      if (success) {
        // 退出登录后重定向到首页
        router.push('/');
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
    <div className="w-64 h-screen bg-white shadow-md flex flex-col">
      <div className="py-6 px-4 flex-grow">
        <h1 className={`${lusitana.className} text-2xl font-bold text-blue-600 mb-6`}>
          社团管理系统
        </h1>
        <nav className="space-y-1">
          {links.map((link) => {
            const LinkIcon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LinkIcon
                  className={`flex-shrink-0 mr-3 h-5 w-5 ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {link.name}
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-blue-700"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* 退出登录按钮 */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeftOnRectangleIcon className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400" />
          {isLoggingOut ? '退出中...' : '退出登录'}
        </button>
      </div>
    </div>
  );
} 