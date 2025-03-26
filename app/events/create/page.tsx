'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  MapPinIcon, 
  PhotoIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';
import Link from 'next/link';

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    date: formatDateForInput(new Date()),
    location: '',
    description: '',
  });
  
  // 获取当前用户并检查权限
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await getClientUser();
        
        // 设置当前用户
        setCurrentUser(user);
        
        // 如果用户不存在或不是管理员，重定向到登录页面
        if (!user) {
          router.push('/login');
          return;
        }
        
        if (user.role !== 'admin') {
          router.push('/events');
          return;
        }
      } catch (error) {
        console.error('验证失败:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.title.trim()) {
      setError('活动标题不能为空');
      return;
    }
    
    if (!formData.date) {
      setError('活动日期不能为空');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('活动地点不能为空');
      return;
    }
    
    try {
      setError('');
      setSubmitting(true);
      
      // 创建 FormData 对象
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('date', formData.date);
      submitData.append('location', formData.location);
      submitData.append('description', formData.description);
      
      // 如果有图片文件，添加到 FormData
      const imageFile = (document.getElementById('image') as HTMLInputElement)?.files?.[0];
      if (imageFile) {
        submitData.append('image', imageFile);
      }
      
      // 调用API创建活动
      const response = await fetch('/api/events', {
        method: 'POST',
        body: submitData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建活动失败');
      }
      
      const data = await response.json();
      
      // 显示成功消息
      setNotification('活动创建成功！');
      
      // 重定向到活动详情页
      setTimeout(() => {
        router.push(`/events/${data.event.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('创建活动失败:', error);
      setError(error.message || '创建活动失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 显示加载中状态
  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>创建活动</h1>
        <Loading fullPage text="加载中" />
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link 
          href="/events" 
          className="mr-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          返回活动列表
        </Link>
        <h1 className={`${lusitana.className} text-2xl font-bold`}>创建新活动</h1>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* 成功提示 */}
      {notification && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          <p>{notification}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* 活动标题 */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            活动标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="输入活动标题"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        {/* 活动日期 */}
        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            活动日期 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* 活动地点 */}
        <div className="mb-6">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            活动地点 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="输入活动地点"
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* 活动描述 */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            活动描述
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="输入活动描述"
              rows={4}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* 活动封面图片 */}
        <div className="mb-6">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            封面图片 (可选)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhotoIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="预览图片"
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">
            支持 jpg、png、gif 等常见图片格式
          </p>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? '创建中...' : '创建活动'}
          </button>
        </div>
      </form>
    </div>
  );
}

// 格式化日期为 input datetime-local 格式
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}