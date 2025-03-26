/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import { Task, TaskStatus, TaskForm } from '@/app/lib/definitions';
import Loading from '@/app/ui/loading';

export default function TasksPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Suspense fallback={<Loading fullPage text="加载中..." />}>
        <TasksContent />
      </Suspense>
    </DndProvider>
  );
}

function TasksContent() {
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [notification, setNotification] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskForm>({
    title: '',
    description: '',
    location: '',
    due_date: ''
  });
  const [members, setMembers] = useState<{id: string; name: string}[]>([]);
  const [filter, setFilter] = useState<string>(searchParams.get('assignee') || 'all');
  
  const router = useRouter();
  
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
  
  // 获取任务列表
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // 构建URL，添加过滤参数
        let url = '/api/tasks';
        if (filter && filter !== 'all') {
          url += `?assignee=${filter}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('获取任务列表失败');
        }
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error: any) {
        setError(error.message);
        console.error('获取任务失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser, filter]);
  
  // 获取成员列表（用于任务指派）
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('获取成员列表失败');
        }
        const data = await response.json();
        setMembers(data.users || []);
      } catch (error) {
        console.error('获取成员失败:', error);
      }
    };
    
    if (currentUser?.role === 'admin') {
      fetchMembers();
    }
  }, [currentUser]);
  
  // 分组任务
  const notStartedTasks = tasks.filter(task => task.status === TaskStatus.NOT_STARTED);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  
  // 更新任务状态
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setLoadingTaskId(taskId);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if(response.status === 403){
        setNotification('您没有权限更新此任务,只有被指派人或是任务创建者可以更新此任务');
        setTimeout(() => setNotification(''), 3000);
        return;
      }

      if (!response.ok) {
        throw new Error('更新任务状态失败');
      }

      
      // 更新本地状态
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      setNotification('任务状态已更新');
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      setNotification('更新任务状态失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setLoadingTaskId(null);
    }
  };
  
  // 创建新任务
  const handleCreateTask = async () => {
    try {
      if (!newTask.title) {
        setNotification('任务标题不能为空');
        setTimeout(() => setNotification(''), 3000);
        return;
      }
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建任务失败');
      }
      
      const data = await response.json();
      
      // 添加到本地状态
      setTasks(prevTasks => [...prevTasks, data.task]);
      
      // 重置表单
      setNewTask({
        title: '',
        description: '',
        location: '',
        due_date: ''
      });
      
      // 关闭模态框
      setIsCreateModalOpen(false);
      
      setNotification('任务创建成功');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: any) {
      console.error('创建任务失败:', error);
      setNotification(`创建任务失败: ${error.message}`);
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 处理筛选变更
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    // 更新URL参数，以便刷新时保持筛选状态
    if (newFilter !== 'all') {
      router.push(`/tasks?assignee=${newFilter}`);
    } else {
      router.push('/tasks');
    }
  };
  
  // 任务列表加载中
  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>任务管理</h1>
        <Loading fullPage text="任务加载中" />
      </div>
    );
  }
  
  // 加载出错
  if (error) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>任务管理</h1>
        <div className="text-center py-10">
          <div className="text-red-500 mb-2">加载失败</div>
          <div className="text-gray-500">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 顶部标题区域 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h1 className={`${lusitana.className} text-2xl font-bold`}>任务管理</h1>
        
        <div className="flex space-x-2">
          {/* 筛选按钮 */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FunnelIcon className="h-4 w-4 mr-2" />
                {filter === 'all' ? '所有任务' : 
                 filter === 'me' ? '指派给我的' : 
                 filter === 'created' ? '我创建的' : '筛选'}
                <ChevronDownIcon className="h-4 w-4 ml-2" />
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
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${filter === 'all' ? 'bg-blue-50' : ''} block w-full text-left px-4 py-2 text-sm`}
                        onClick={() => handleFilterChange('all')}
                      >
                        所有任务
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${filter === 'me' ? 'bg-blue-50' : ''} block w-full text-left px-4 py-2 text-sm`}
                        onClick={() => handleFilterChange('me')}
                      >
                        指派给我的
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } ${filter === 'created' ? 'bg-blue-50' : ''} block w-full text-left px-4 py-2 text-sm`}
                        onClick={() => handleFilterChange('created')}
                      >
                        我创建的
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          
          {/* 创建任务按钮 */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <PlusIcon className="w-5" />
            <span>创建任务</span>
          </button>
        </div>
      </div>
      
      {/* 过滤状态提示 */}
      {filter !== 'all' && (
        <div className="bg-blue-50 rounded-md py-2 px-4 text-sm text-blue-700 mb-4 flex items-center justify-between">
          <span>
            {filter === 'me' ? '当前显示: 指派给我的任务' : '当前显示: 我创建的任务'}
          </span>
          <button 
            onClick={() => handleFilterChange('all')}
            className="text-blue-500 hover:text-blue-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* 通知消息 */}
      {notification && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification('')}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* 看板内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 未开始列 */}
        <TaskColumn 
          title="未开始" 
          status={TaskStatus.NOT_STARTED} 
          tasks={notStartedTasks}
          onDrop={handleTaskStatusChange}
          bgColor="bg-gray-100"
          iconColor="text-gray-400"
          loadingTaskId={loadingTaskId}
        />
        
        {/* 进行中列 */}
        <TaskColumn 
          title="进行中" 
          status={TaskStatus.IN_PROGRESS} 
          tasks={inProgressTasks}
          onDrop={handleTaskStatusChange}
          bgColor="bg-blue-50"
          iconColor="text-blue-500"
          loadingTaskId={loadingTaskId}
        />
        
        {/* 已完成列 */}
        <TaskColumn 
          title="已完成" 
          status={TaskStatus.COMPLETED} 
          tasks={completedTasks}
          onDrop={handleTaskStatusChange}
          bgColor="bg-green-50"
          iconColor="text-green-500"
          loadingTaskId={loadingTaskId}
        />
      </div>
      
      {/* 创建任务模态框 */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsCreateModalOpen(false)}
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
            
            {/* 使内容垂直居中 */}
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
                  创建新任务
                </Dialog.Title>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      任务标题 *
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="输入任务标题"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      任务描述
                    </label>
                    <textarea
                      id="description"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="输入任务描述"
                      rows={3}
                      value={newTask.description || ''}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      任务地点
                    </label>
                    <input
                      type="text"
                      id="location"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="输入任务地点"
                      value={newTask.location || ''}
                      onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                      截止时间
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newTask.due_date || ''}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                      指派成员
                    </label>
                    <select
                      id="assignee"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newTask.assignee_id || ''}
                      onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value || undefined })}
                    >
                      <option value="">未指派</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    onClick={handleCreateTask}
                  >
                    创建
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

// 任务卡片组件
function TaskCard({ task, index, isLoading }: { task: Task; index: number; isLoading: boolean }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  
  return (
    <div
      // @ts-expect-error - React-dnd type issue
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer relative"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
          <Loading size="small" text="更新中" />
        </div>
      )}
      
      <Link href={`/tasks/${task.id}`} className="block">
        <h3 className="font-semibold text-gray-800 mb-2 truncate">{task.title}</h3>
        
        {task.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex flex-col space-y-1.5">
          {task.due_date && (
            <div className="flex items-center text-xs text-gray-500">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPinIcon className="h-3.5 w-3.5 mr-1" />
              <span className="truncate">{task.location}</span>
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-500">
            <UserIcon className="h-3.5 w-3.5 mr-1" />
            <span>
              {task.assignee_name ? `指派给: ${task.assignee_name}` : '未指派'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// 任务列组件
function TaskColumn({ 
  title, 
  status, 
  tasks, 
  onDrop,
  bgColor,
  iconColor,
  loadingTaskId
}: { 
  title: string; 
  status: TaskStatus; 
  tasks: Task[];
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  bgColor: string;
  iconColor: string;
  loadingTaskId: string | null;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string, status: TaskStatus }) => {
      if (item.status !== status) {
        onDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));
  
  return (
    <div 
      // @ts-expect-error - React-dnd type issue
      ref={drop} 
      className={`${bgColor} rounded-lg p-4 ${isOver ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center">
          <span className={`w-3 h-3 rounded-full ${iconColor} mr-2`}></span>
          {title}
        </h2>
        <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            拖拽任务到此列
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              index={index} 
              isLoading={loadingTaskId === task.id} 
            />
          ))
        )}
      </div>
    </div>
  );
}

// 辅助函数：格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
} 