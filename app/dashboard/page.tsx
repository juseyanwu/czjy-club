'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  BuildingLibraryIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';

// 仪表板卡片组件
function DashboardCard({ 
  title, 
  value, 
  icon: Icon, 
  bgColor 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bgColor: string; 
}) {
  return (
    <div className="flex bg-white p-6 rounded-lg shadow-md">
      <div className={`flex items-center justify-center h-12 w-12 rounded-full ${bgColor}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string} | null>(null);
  const [stats, setStats] = useState({
    totalMembers: '加载中...',
    totalEvents: '加载中...',
    totalClubs: '加载中...',
    activeUsers: '加载中...'
  });
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getClientUser();
      if (!user) {
        // 如果用户未登录，重定向到登录页面
        router.push('/login');
        return;
      }
      setCurrentUser(user);
    };

    fetchUser();
  }, [router]);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      try {
        // 这里可以调用API获取真实数据
        // 暂时使用模拟数据
        setTimeout(() => {
          setStats({
            totalMembers: '128',
            totalEvents: '45',
            totalClubs: '12',
            activeUsers: '89'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>仪表板</h1>
        <Loading fullPage text="数据加载中" color="blue" size="large" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-6">
      <div className="mb-8">
        <h1 className={`${lusitana.className} text-2xl font-bold`}>仪表板</h1>
        <p className="text-gray-600 mt-1">欢迎使用社团管理系统，{currentUser?.name}</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard 
          title="总成员数" 
          value={stats.totalMembers} 
          icon={UserGroupIcon} 
          bgColor="bg-blue-500"
        />
        <DashboardCard 
          title="总活动数" 
          value={stats.totalEvents} 
          icon={CalendarIcon} 
          bgColor="bg-green-500"
        />
        <DashboardCard 
          title="社团数量" 
          value={stats.totalClubs} 
          icon={BuildingLibraryIcon} 
          bgColor="bg-purple-500"
        />
        <DashboardCard 
          title="活跃用户" 
          value={stats.activeUsers} 
          icon={ChartBarIcon} 
          bgColor="bg-orange-500"
        />
      </div>
      
      {/* 系统公告 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className={`${lusitana.className} text-xl font-semibold mb-4`}>系统公告</h2>
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <p className="text-gray-700">欢迎使用社团管理系统新版本！我们添加了更多功能，提升了用户体验。</p>
          <p className="text-sm text-gray-500 mt-1">2023-03-22</p>
        </div>
      </div>
      
      {/* 快速操作 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className={`${lusitana.className} text-xl font-semibold mb-4`}>快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/members')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700">管理成员</span>
          </button>
          
          <button
            onClick={() => router.push('/events')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <CalendarIcon className="h-5 w-5 text-green-600" />
            <span className="text-green-700">管理活动</span>
          </button>
          
          <button
            onClick={() => router.push('/clubs')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <BuildingLibraryIcon className="h-5 w-5 text-purple-600" />
            <span className="text-purple-700">管理社团</span>
          </button>
        </div>
      </div>
    </main>
  );
}