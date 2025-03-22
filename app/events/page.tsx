'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  PlusIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';

// 定义事件类型接口
interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  image_url?: string;
  created_at: string;
  organizer_id: string;
  organizer_name: string;
  is_registered?: boolean;
  registration_count?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('全部活动');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [notification, setNotification] = useState('');
  
  // 检查用户登录和角色
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getClientUser();
      setCurrentUser(user);
    };
    
    fetchUser();
  }, []);

  // 选项卡列表
  const tabs = ['全部活动', '进行中', '即将开始', '已结束', '草稿'];

  // 获取活动状态
  const getEventStatus = (eventDate: string): string => {
    const today = new Date();
    const eventDateTime = new Date(eventDate);
    
    // 设置时间为今天的开始和结束
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    // 活动日期在今天之前视为已结束
    if (eventDateTime < startOfToday) {
      return '已结束';
    }
    // 活动日期是今天，视为进行中
    else if (eventDateTime >= startOfToday && eventDateTime <= endOfToday) {
      return '进行中';
    }
    // 活动日期在今天之后，视为即将开始
    else {
      return '即将开始';
    }
  };

  // 根据选项卡筛选活动
  const filteredEvents = events.filter(event => {
    // 搜索过滤
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 选项卡过滤
    if (activeTab === '全部活动') {
      return matchesSearch;
    }
    
    const status = getEventStatus(event.date);
    return status === activeTab && matchesSearch;
  });

  // 获取活动状态标签
  function getStatusLabel(status: string) {
    switch (status) {
      case '进行中':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
            进行中
          </span>
        );
      case '即将开始':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
            即将开始
          </span>
        );
      case '已结束':
        return (
          <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white rounded-full">
            已结束
          </span>
        );
      default:
        return null;
    }
  }
  
  // 获取默认图片URL
  function getDefaultImageUrl(eventTitle: string): string {
    // 根据活动名称选择默认图片
    if (eventTitle.includes('摄影')) return '/images/event-photo.jpg';
    if (eventTitle.includes('音乐')) return '/images/event-music.jpg';
    if (eventTitle.includes('篮球') || eventTitle.includes('运动')) return '/images/event-sports.jpg';
    if (eventTitle.includes('读书会') || eventTitle.includes('文学')) return '/images/event-book.jpg';
    if (eventTitle.includes('环保') || eventTitle.includes('志愿者')) return '/images/event-volunteer.jpg';
    
    // 随机选择默认图片
    const images = [
      '/images/event-default-1.jpg',
      '/images/event-default-2.jpg',
      '/images/event-default-3.jpg',
    ];
    return images[Math.floor(Math.random() * images.length)];
  }

  // 获取活动列表 - 修改为从API获取
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        // 从API端点获取数据
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('获取活动数据失败');
        }
        const data = await response.json();
        
        // 确保数据符合本页面的Event接口
        const formattedEvents: Event[] = data.events.map((event: Record<string, unknown>) => ({
          ...event,
          is_registered: false,
          registration_count: 0
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('获取活动失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  // 加载中状态
  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>活动管理</h1>
        <Loading fullPage text="活动数据加载中" />
      </div>
    );
  }

  // 报名参加活动
  const registerEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '报名失败');
      }
      
      // 更新本地状态
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            is_registered: true,
            registration_count: (event.registration_count || 0) + 1
          };
        }
        return event;
      }));
      
      setNotification('报名成功！');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: unknown) {
      console.error('报名失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setNotification(`报名失败: ${errorMessage}`);
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 取消报名
  const cancelRegistration = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '取消报名失败');
      }
      
      // 更新本地状态
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            is_registered: false,
            registration_count: Math.max((event.registration_count || 1) - 1, 0)
          };
        }
        return event;
      }));
      
      setNotification('已取消报名');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: unknown) {
      console.error('取消报名失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setNotification(`取消报名失败: ${errorMessage}`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  return (
    <div className="p-6">
      {/* 顶部标题区域 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className={`${lusitana.className} text-2xl font-bold`}>活动管理</h1>
        
        {/* 只有管理员可以创建活动 */}
        {currentUser?.role === 'admin' && (
          <Link
            href="/events/create"
            className="flex items-center gap-1 self-start rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 md:self-auto"
          >
            <PlusIcon className="w-5" />
            <span>创建活动</span>
          </Link>
        )}
      </div>
      
      {/* 通知消息 */}
      {notification && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification('')}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* 搜索和筛选区域 */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        {/* 搜索框 */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="搜索活动名称、地点或组织者"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        {/* 选项卡 */}
        <div className="flex items-center space-x-2 overflow-x-auto p-1 w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        </div>

        {/* 活动列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event.date);
            const isExpired = status === '已结束';
            
            return (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* 活动图片 */}
                <div 
                  className="h-48 bg-cover bg-center relative" 
                  style={{
                    backgroundImage: `url(${event.image_url || getDefaultImageUrl(event.title)})`
                  }}
                >
                  {/* 状态标签 */}
                  <div className="absolute top-4 right-4">
                    {getStatusLabel(status)}
                  </div>
                </div>
                
                {/* 活动信息 */}
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2 truncate">{event.title}</h3>
                  
                  <div className="flex items-center text-gray-500 mb-2">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 mb-2">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 mb-4">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    <span>组织者: {event.organizer_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      报名人数: {event.registration_count || 0}
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* 详情按钮 */}
                      <Link
                        href={`/events/${event.id}`}
                        className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                      >
                        详情
                      </Link>
                      
                      {/* 报名/取消按钮 - 仅为非管理员显示且活动未结束 */}
                      {!isExpired && currentUser && (
                        event.is_registered ? (
                          <button
                            onClick={() => cancelRegistration(event.id)}
                            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-600 rounded-md hover:bg-gray-50 flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            取消报名
                          </button>
                        ) : (
                          <button
                            onClick={() => registerEvent(event.id)}
                            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            报名参加
                          </button>
                        )
                      )}
                      
                      {/* 管理员编辑按钮 */}
                      {currentUser?.role === 'admin' && (
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="px-3 py-1.5 text-sm text-amber-600 border border-amber-600 rounded-md hover:bg-amber-50"
                        >
                          管理
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <p className="text-gray-500">没有找到匹配的活动</p>
          </div>
        )}
      </div>
  );
  
  // 辅助函数：格式化日期
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long'
    });
  }
}