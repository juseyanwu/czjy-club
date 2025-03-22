'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UserIcon, 
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// 用户详情接口
interface UserDetail {
  id: string;
  name: string;
  email: string;
  events_count: number;
  events: {
    id: string;
    title: string;
    date: string;
  }[];
}

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string} | null>(null);
  const [member, setMember] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [editedMember, setEditedMember] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  
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

  // 获取成员详情
  useEffect(() => {
    const fetchMemberDetail = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/members/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '获取成员详情失败');
        }
        
        const data = await response.json();
        setMember(data.user);
        
        // 初始化编辑表单数据
        setEditedMember({
          name: data.user.name,
          email: data.user.email,
          password: '',
        });
      } catch (error) {
        console.error('获取成员详情失败:', error);
        setError('获取成员详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchMemberDetail();
    }
  }, [currentUser, params.id]);

  // 处理编辑提交
  const handleEditSubmit = async () => {
    try {
      // 验证表单
      if (!editedMember.name || !editedMember.email) {
        setError('姓名和邮箱为必填项');
        return;
      }

      // 准备更新数据
      const updateData: any = {
        name: editedMember.name,
        email: editedMember.email,
      };

      // 如果输入了密码，则包含密码字段
      if (editedMember.password) {
        updateData.password = editedMember.password;
      }

      const response = await fetch(`/api/members/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新成员信息失败');
      }

      const data = await response.json();
      
      // 更新本地成员数据
      setMember(prev => prev ? {
        ...prev,
        name: data.user.name,
        email: data.user.email,
      } : null);
      
      setNotification('成员信息更新成功');
      setIsEditMode(false);
      
      // 清除通知
      setTimeout(() => {
        setNotification('');
      }, 3000);
    } catch (error: any) {
      console.error('更新成员信息失败:', error);
      setError(error.message || '更新成员信息失败，请稍后再试');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (member) {
      setEditedMember({
        name: member.name,
        email: member.email,
        password: '',
      });
    }
    setIsEditMode(false);
    setIsPasswordVisible(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`${lusitana.className} text-2xl font-bold`}>成员详情</h1>
        <div className="flex items-center space-x-4">
          {isEditMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                取消
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex items-center text-green-600 hover:text-green-800"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                保存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <PencilSquareIcon className="w-4 h-4 mr-1" />
                编辑
              </button>
              <Link
                href="/members"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                返回列表
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* 通知和错误提示 */}
      {notification && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{notification}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification('')}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError('')}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {member && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 成员基本信息卡片 */}
          <div className="col-span-1 bg-white rounded-lg shadow-md p-6">
            {/* 头像 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* 成员信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedMember.name}
                    onChange={(e) => setEditedMember({ ...editedMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <p>{member.name}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                {isEditMode ? (
                  <input
                    type="email"
                    value={editedMember.email}
                    onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <p>{member.email}</p>
                  </div>
                )}
              </div>
              
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value={editedMember.password}
                      onChange={(e) => setEditedMember({ ...editedMember, password: e.target.value })}
                      placeholder="留空表示不修改密码"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {isPasswordVisible ? "隐藏" : "显示"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">如果不需要修改密码，请留空</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动数量</label>
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 text-gray-500 mr-2" />
                  <p>{member.events_count || 0} 个活动</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 成员活动列表 */}
          <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className={`${lusitana.className} text-xl font-bold mb-6`}>参与的活动</h2>
            
            {member.events && member.events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活动名称</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {member.events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 text-center rounded-lg">
                <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">该成员暂无参与活动</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
} 