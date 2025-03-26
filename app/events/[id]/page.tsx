'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';
import { formatDate } from '@/app/lib/utils';

// 活动详情接口
interface EventDetail {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  registrations: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    status: string;
    created_at: string;
  }>;
  total_registrations: number;
  current_user_registered: boolean;
  is_admin: boolean;
}

// 报名状态接口
interface RegistrationStatus {
  registered: boolean;
  registration?: {
    id: string;
    status: string;
    createdAt: string;
  };
  error?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: string}>({message: '', type: ''});
  
  // 解析参数
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setEventId(resolvedParams.id);
      } catch (error) {
        console.error('解析参数错误:', error);
        setError('加载活动信息失败');
      }
    };
    
    resolveParams();
  }, [params]);
  
  // 获取当前用户
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getClientUser();
      setCurrentUser(user);
    };
    
    fetchUser();
  }, []);
  
  // 获取活动详情
  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '获取活动详情失败');
        }
        
        const data = await response.json();
        setEvent(data.event);
      } catch (error: any) {
        console.error('获取活动详情失败:', error);
        setError(error.message || '获取活动详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetail();
  }, [eventId]);
  
  // 报名活动
  const handleRegister = async () => {
    if (!eventId || !currentUser) {
      if (!currentUser) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
      return;
    }
    
    try {
      setIsRegistering(true);
      
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
      setEvent(prev => {
        if (!prev || !currentUser) return prev;
        
        return {
          ...prev,
          current_user_registered: true,
          registrations: [
            ...prev.registrations,
            {
              id: 'temp-id', // 临时ID，刷新后会获取真实ID
              user: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email
              },
              status: 'registered',
              created_at: new Date().toISOString()
            }
          ],
          total_registrations: prev.total_registrations + 1
        };
      });
      
      showNotification('报名成功！', 'success');
    } catch (error: any) {
      console.error('报名失败:', error);
      showNotification(error.message || '报名失败，请稍后再试', 'error');
    } finally {
      setIsRegistering(false);
    }
  };
  
  // 取消报名
  const handleCancelRegistration = async () => {
    if (!eventId) return;
    
    try {
      setIsCanceling(true);
      
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '取消报名失败');
      }
      
      // 更新本地状态
      setEvent(prev => {
        if (!prev || !currentUser) return prev;
        
        return {
          ...prev,
          current_user_registered: false,
          registrations: prev.registrations.filter(reg => reg.user.id !== currentUser.id),
          total_registrations: prev.total_registrations - 1
        };
      });
      
      showNotification('已成功取消报名', 'success');
    } catch (error: any) {
      console.error('取消报名失败:', error);
      showNotification(error.message || '取消报名失败，请稍后再试', 'error');
    } finally {
      setIsCanceling(false);
    }
  };
  
  // 删除活动
  const handleDeleteEvent = async () => {
    if (!eventId) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除活动失败');
      }
      
      showNotification('活动已删除', 'success');
      setIsDeleteModalOpen(false);
      
      // 延迟跳转，让用户能看到成功提示
      setTimeout(() => {
        router.push('/events');
      }, 1500);
    } catch (error: any) {
      console.error('删除活动失败:', error);
      showNotification(error.message || '删除活动失败，请稍后再试', 'error');
      setIsDeleteModalOpen(false);
    }
  };
  
  // 显示通知
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md max-w-md">
          <p className="font-bold">错误</p>
          <p>{error}</p>
          <div className="mt-4">
            <Link href="/events" className="text-blue-500 hover:underline flex items-center">
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              返回活动列表
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">活动不存在或已被删除</h2>
          <div className="mt-4">
            <Link href="/events" className="text-blue-500 hover:underline flex items-center justify-center">
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              返回活动列表
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const isEventPassed = new Date(event.date) < new Date();
  
  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 顶部导航和操作区 */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/events" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          返回活动列表
        </Link>
        
        <div className="flex space-x-3">
          {!isEventPassed && (
            <>
              {event.current_user_registered ? (
                <button
                  onClick={handleCancelRegistration}
                  disabled={isCanceling}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  {isCanceling ? '正在取消...' : '取消报名'}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  {isRegistering ? '正在报名...' : '报名参加'}
                </button>
              )}
            </>
          )}
          
          {event.is_admin && (
            <>
              <Link
                href={`/events/${event.id}/edit`}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                编辑活动
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                删除活动
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 通知消息 */}
      {notification.message && (
        <div className={`mb-6 ${
          notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
        } border-l-4 p-4 rounded shadow-md`}>
          {notification.message}
        </div>
      )}
      
      {/* 活动内容 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 活动信息卡 */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          {/* 活动图片 */}
          {event.image_url ? (
            <div className="w-full h-64 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-40 bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-16 h-16 text-blue-400" />
            </div>
          )}
          
          {/* 活动标题和基本信息 */}
          <div className="p-6">
            <h1 className={`${lusitana.className} text-3xl font-bold mb-4`}>{event.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="w-5 h-5 mr-2" />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <UserIcon className="w-5 h-5 mr-2" />
                <span>组织者: {event.organizer.name}</span>
              </div>
            </div>
            
            {/* 活动描述 */}
            <div className="mt-6">
              <h2 className={`${lusitana.className} text-xl font-semibold mb-3`}>活动详情</h2>
              <div className="prose max-w-full">
                {event.description ? (
                  <p className="whitespace-pre-line">{event.description}</p>
                ) : (
                  <p className="text-gray-500 italic">暂无活动详情</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 报名成员列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className={`${lusitana.className} text-xl font-semibold mb-3 flex items-center`}>
              <UserIcon className="w-5 h-5 mr-2" />
              报名成员 ({event.total_registrations})
            </h2>
            
            {event.registrations && event.registrations.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {event.registrations.map((registration) => (
                  <li key={registration.id} className="py-3 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <UserIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{registration.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(registration.created_at).toLocaleDateString('zh-CN')} 报名
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>暂无成员报名</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">确认删除</h3>
            <p className="mb-6">您确定要删除活动 "{event.title}" 吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 