/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import { Task, TaskStatus, TaskComment, TaskLog } from '@/app/lib/definitions';
import Loading from '@/app/ui/loading';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [notification, setNotification] = useState('');
  const [commentText, setCommentText] = useState('');
  const [updateStatus, setUpdateStatus] = useState<TaskStatus | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [members, setMembers] = useState<{id: string; name: string}[]>([]);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  
  const router = useRouter();
  
  // 解析参数
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setTaskId(resolvedParams.id);
      } catch (error) {
        console.error('解析参数错误:', error);
        setError('加载任务信息失败');
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
      } else {
        setCurrentUser(user);
      }
    };
    
    fetchUser();
  }, [router]);
  
  // 获取任务详情
  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (!taskId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error('获取任务详情失败');
        }
        const data = await response.json();
        setTask(data.task);
      } catch (error: any) {
        setError(error.message);
        console.error('获取任务详情失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && taskId) {
      fetchTaskDetail();
    }
  }, [currentUser, taskId]);
  
  // 获取所有用户
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('获取用户列表失败');
        }
        const data = await response.json();
        setMembers(data.users || []);
      } catch (error) {
        console.error('获取用户列表错误:', error);
      }
    };
    
    if (currentUser && (currentUser.role === 'admin' || task?.creator_id === currentUser.id)) {
      fetchMembers();
    }
  }, [currentUser, task]);
  
  // 添加评论
  const handleAddComment = async () => {
    if (!taskId || !commentText.trim()) {
      setNotification('评论内容不能为空');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('添加评论失败');
      }
      
      const data = await response.json();
      
      // 更新本地状态
      if (task) {
        setTask({
          ...task,
          comments: [...(task.comments || []), data.comment]
        });
      }
      
      // 清空评论框
      setCommentText('');
      
      setNotification('评论已添加');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('添加评论失败:', error);
      setNotification('添加评论失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 更新任务状态
  const handleUpdateStatus = async (newStatus: TaskStatus) => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('更新任务状态失败');
      }
      
      const data = await response.json();
      
      // 更新本地状态
      if (task) {
        setTask({
          ...task,
          status: newStatus,
          updated_at: data.task.updated_at
        });
      }
      
      setUpdateStatus(null); // 关闭确认框
      
      setNotification('任务状态已更新');
      setTimeout(() => setNotification(''), 3000);
      
      // 刷新任务详情（包括日志）
      fetchTaskDetail();
    } catch (error) {
      console.error('更新任务状态失败:', error);
      setNotification('更新任务状态失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 删除任务
  const handleDeleteTask = async () => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除任务失败');
      }
      
      setNotification('任务已删除');
      setTimeout(() => {
        router.push('/tasks');
      }, 1000);
    } catch (error) {
      console.error('删除任务失败:', error);
      setNotification('删除任务失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 更新任务指派人
  const handleUpdateAssignee = async () => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignee_id: selectedAssignee === '' ? null : selectedAssignee
        })
      });
      
      if (!response.ok) {
        throw new Error('更新任务指派人失败');
      }
      
      const data = await response.json();
      
      // 更新本地状态
      if (task) {
        setTask({
          ...task,
          assignee_id: data.task.assignee_id,
          assignee_name: data.task.assignee_name,
          updated_at: data.task.updated_at
        });
      }
      
      setIsAssigneeModalOpen(false); // 关闭模态框
      
      setNotification('任务指派人已更新');
      setTimeout(() => setNotification(''), 3000);
      
      // 刷新任务详情
      fetchTaskDetail();
    } catch (error) {
      console.error('更新任务指派人失败:', error);
      setNotification('更新任务指派人失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 检查是否有权限更新任务
  const canEdit = currentUser && (
    currentUser.role === 'admin' || 
    (task && (task.creator_id === currentUser.id || task.assignee_id === currentUser.id))
  );
  
  // 检查是否可以删除任务
  const canDelete = currentUser && (
    currentUser.role === 'admin' || 
    (task && task.creator_id === currentUser.id)
  );
  
  // 辅助函数：获取任务状态文本
  const getStatusText = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return '未开始';
      case TaskStatus.IN_PROGRESS:
        return '进行中';
      case TaskStatus.COMPLETED:
        return '已完成';
      default:
        return '未知状态';
    }
  };
  
  // 辅助函数：获取任务状态颜色
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'bg-gray-200 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  // 辅助函数：获取任务状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return <ClockIcon className="h-5 w-5" />;
      case TaskStatus.IN_PROGRESS:
        return <ArrowLeftIcon className="h-5 w-5" />;
      case TaskStatus.COMPLETED:
        return <CheckIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };
  
  // 辅助函数，用于刷新任务详情
  const fetchTaskDetail = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('获取任务详情失败');
      }
      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('刷新任务详情失败:', error);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 显示加载中
  if (loading) {
    return (
      <div className="p-6">
        <Link href="/tasks" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回任务列表
        </Link>
        <Loading fullPage text="任务详情加载中" />
      </div>
    );
  }
  
  // 显示错误
  if (error || !task) {
    return (
      <div className="p-6">
        <Link href="/tasks" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回任务列表
        </Link>
        <div className="text-center py-10">
          <div className="text-red-500 mb-2">加载失败</div>
          <div className="text-gray-500">{error || '无法找到该任务'}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          返回任务列表
        </Link>
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
      
      <div className="space-y-6">
        {/* 任务头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className={`${lusitana.className} text-2xl font-bold`}>{task.title}</h1>
            
            <div className="flex space-x-2">
              {/* 状态徽章 */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </span>
              
              {/* 操作按钮 */}
              {canEdit && (
                <>
                  <Menu as="div" className="relative inline-block text-left">
                    <div>
                      <Menu.Button className="inline-flex justify-center w-full px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                        更改状态
                        <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="px-1 py-1">
                          {Object.values(TaskStatus).map((status) => (
                            <Menu.Item key={status}>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active ? 'bg-blue-500 text-white' : 'text-gray-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                  onClick={() => setUpdateStatus(status)}
                                  disabled={task.status === status}
                                >
                                  <span className="mr-2">{getStatusIcon(status)}</span>
                                  {getStatusText(status)}
                                </button>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  
                  {/* 指派任务按钮 */}
                  {(currentUser?.role === 'admin' || task.creator_id === currentUser?.id) && (
                    <button
                      onClick={() => {
                        setSelectedAssignee(task.assignee_id || '');
                        setIsAssigneeModalOpen(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <UserIcon className="h-4 w-4 mr-1" />
                      {task.assignee_name ? '重新指派' : '指派任务'}
                    </button>
                  )}
                </>
              )}
              
              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  删除
                </button>
              )}
            </div>
          </div>
          
          {/* 任务信息 */}
          <div className="space-y-4">
            {task.description && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">创建人:</span>
                <span>{task.creator_name}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">指派给:</span>
                <span>{task.assignee_name || '未指派'}</span>
              </div>
              
              {task.location && (
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">地点:</span>
                  <span>{task.location}</span>
                </div>
              )}
              
              {task.due_date && (
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">截止日期:</span>
                  <span>{formatDate(task.due_date)}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">创建时间:</span>
                <span>{formatDate(task.created_at)}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">更新时间:</span>
                <span>{formatDate(task.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 评论区域 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
            评论
          </h2>
          
          {/* 评论列表 */}
          <div className="space-y-4 mb-6">
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{comment.user_name}</span>
                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                暂无评论，添加第一条评论吧！
              </div>
            )}
          </div>
          
          {/* 添加评论 */}
          <div className="flex">
            <textarea
              className="flex-grow rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="添加评论..."
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md flex items-center"
              onClick={handleAddComment}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* 日志区域 */}
        {task.logs && task.logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">活动日志</h2>
            
            <div className="space-y-3">
              {task.logs.map((log) => (
                <div key={log.id} className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <UserIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.user_name}</span>
                      <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 状态更新确认模态框 */}
      <Transition appear show={updateStatus !== null} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setUpdateStatus(null)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  确认更改任务状态
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    您确定要将任务状态从 <span className="font-medium">{getStatusText(task?.status || TaskStatus.NOT_STARTED)}</span> 更改为 <span className="font-medium">{updateStatus !== null ? getStatusText(updateStatus) : ''}</span> 吗?
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={() => setUpdateStatus(null)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={() => updateStatus !== null && handleUpdateStatus(updateStatus)}
                  >
                    确认更改
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      
      {/* 删除确认模态框 */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  确认删除任务
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    您确定要删除此任务吗？此操作无法撤销。
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                    onClick={handleDeleteTask}
                  >
                    删除
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
      
      {/* 指派任务模态框 */}
      <Transition appear show={isAssigneeModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsAssigneeModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  指派任务
                </Dialog.Title>
                <div className="mt-4">
                  <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                    选择成员
                  </label>
                  <select
                    id="assignee"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                  >
                    <option value="">未指派</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={() => setIsAssigneeModalOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handleUpdateAssignee}
                  >
                    确认指派
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

// ChevronDownIcon 组件
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      {...props}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M19 9l-7 7-7-7" 
      />
    </svg>
  );
} 