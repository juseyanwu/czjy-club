'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';

// 活动详情接口
interface EventDetail {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string | null;
  image_url: string | null;
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    image_url: ''
  });
  
  const router = useRouter();
  
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
      if (!user) {
        router.push('/login');
        return;
      }
      
      // 检查用户权限
      if (user.role !== 'admin') {
        setError('没有权限');
        setTimeout(() => {
          router.push('/events');
        }, 2000);
        return;
      }
      
      setCurrentUser(user);
    };
    
    fetchUser();
  }, [router]);
  
  // 获取活动详情
  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!currentUser || !eventId) return;
      
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
        
        // 初始化表单数据
        setFormData({
          title: data.event.title || '',
          date: data.event.date || '',
          location: data.event.location || '',
          description: data.event.description || '',
          image_url: data.event.image_url || ''
        });
      } catch (error: any) {
        console.error('获取活动详情失败:', error);
        setError(error.message || '获取活动详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetail();
  }, [currentUser, eventId]);
  
  // 处理表单提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!eventId) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // 表单验证
      if (!formData.title || !formData.date || !formData.location) {
        setError('活动标题、日期和地点为必填项');
        setIsSaving(false);
        return;
      }
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新活动失败');
      }
      
      setNotification('活动更新成功');
      
      // 延迟跳转到活动详情页
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 1500);
    } catch (error: any) {
      console.error('更新活动失败:', error);
      setError(error.message || '更新活动失败，请稍后再试');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md max-w-md">
          <p className="font-bold">权限不足</p>
          <p>只有管理员可以编辑活动</p>
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
  
  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 顶部导航 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/events/${eventId}`} className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            返回活动详情
          </Link>
          <h1 className={`${lusitana.className} text-2xl font-bold`}>编辑活动</h1>
        </div>
      </div>
      
      {/* 通知 */}
      {notification && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          {notification}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
          {error}
        </div>
      )}
      
      {/* 编辑表单 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 活动标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              活动标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="输入活动标题"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* 活动日期 */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              活动日期 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* 活动地点 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              活动地点 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="输入活动地点"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* 活动封面图 */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              封面图片URL（可选）
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="输入图片URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">请输入有效的图片URL地址</p>
          </div>
          
          {/* 活动描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              活动描述（可选）
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              placeholder="输入活动描述"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* 按钮组 */}
          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href={`/events/${eventId}`}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              取消
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              {isSaving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 