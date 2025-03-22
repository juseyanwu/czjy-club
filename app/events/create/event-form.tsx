/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { CalendarIcon, MapPinIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { getClientUser } from '@/app/lib/auth';

export default function EventForm() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    image_url: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string} | null>(null);

    // 获取当前登录用户信息
    useEffect(() => {
      const fetchUser = async () => {
        const user = await getClientUser();
        if (!user) {
          // 如果用户未登录，重定向到登录页面
          router.push("/login");
          return;
        }
        setCurrentUser(user);
      };

      fetchUser();
    }, [router]);
    
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('只允许上传图片文件');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      
      // 调用上传API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '上传图片失败');
      }
      
      // 更新表单数据和预览
      setFormData(prev => ({
        ...prev,
        image_url: data.url
      }));
      setImagePreview(data.url);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || '上传图片过程中出现错误');
    } finally {
      setUploading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 检查用户是否已登录
      if (!currentUser) {
        setError('请先登录再创建活动');
        setLoading(false);
        return;
      }
      
      const organizer_id = currentUser.id; // 使用当前登录用户的ID

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizer_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建活动失败');
      }

      // 创建成功，跳转到活动列表页面
      router.push('/events');
      router.refresh(); // 刷新页面数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || '创建活动过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* 活动标题 */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-900"
          htmlFor="title"
        >
          活动标题
        </label>
        <div className="relative">
          <input
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            id="title"
            type="text"
            name="title"
            placeholder="请输入活动标题"
            required
            value={formData.title}
            onChange={handleChange}
          />
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* 活动日期 */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-900"
          htmlFor="date"
        >
          活动日期
        </label>
        <div className="relative">
          <input
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            id="date"
            type="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
          />
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* 活动地点 */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-900"
          htmlFor="location"
        >
          活动地点
        </label>
        <div className="relative">
          <input
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            id="location"
            type="text"
            name="location"
            placeholder="请输入活动地点"
            required
            value={formData.location}
            onChange={handleChange}
          />
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* 活动描述 */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-900"
          htmlFor="description"
        >
          活动描述
        </label>
        <div className="relative">
          <textarea
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            id="description"
            name="description"
            rows={4}
            placeholder="请输入活动描述"
            value={formData.description}
            onChange={handleChange}
          />
          <DocumentTextIcon className="pointer-events-none absolute left-3 top-6 h-[18px] w-[18px] text-gray-500" />
        </div>
      </div>

      {/* 活动图片上传 */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-900"
          htmlFor="image"
        >
          活动图片
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-blue-600 hover:bg-blue-100">
              <input
                type="file"
                id="image"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {uploading ? '上传中...' : '选择图片'}
            </label>
            {formData.image_url && (
              <span className="text-sm text-green-600">图片已上传</span>
            )}
          </div>
          
          {/* 图片预览 */}
          {imagePreview && (
            <div className="relative h-40 w-full max-w-md overflow-hidden rounded-md border border-gray-200">
              <img
                src={imagePreview}
                alt="活动图片预览"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500 bg-red-50 p-3 text-red-700">
          <ExclamationCircleIcon className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          onClick={() => router.push('/events')}
          className="bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '创建中...' : '创建活动'}
        </Button>
      </div>
    </form>
  );
}