'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/app/ui/button';
import { CalendarIcon, MapPinIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

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
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 创建一个临时URL用于预览
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      
      // 在实际应用中，这里应该上传图片到服务器或云存储
      // 这里我们简单地使用一个假URL，实际项目中应替换为真实的上传逻辑
      // 例如使用FormData上传到服务器，或使用第三方服务如AWS S3, Cloudinary等
      // 上传成功后获取返回的URL
      const fakeUploadedUrl = imageUrl; // 实际项目中应替换为真实上传后的URL
      
      setFormData(prev => ({
        ...prev,
        image_url: fakeUploadedUrl
      }));
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
      // 获取当前登录用户ID，这里假设用户已登录
      // 在实际应用中，应该从会话或认证状态中获取
      const organizer_id = '410544b2-4001-4271-9855-fec4b6a6442a'; // 使用默认用户ID

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
        >
          活动图片
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={triggerFileInput}
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PhotoIcon className="mr-2 h-5 w-5 text-gray-500" />
            选择图片
          </button>
          {imagePreview && (
            <div className="relative h-20 w-20 overflow-hidden rounded-md border border-gray-200">
              <Image
                src={imagePreview}
                alt="活动图片预览"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">推荐上传16:9比例的图片，最大文件大小2MB</p>
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