'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HeartIcon, 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { lusitana } from '@/app/ui/fonts';
import { getClientUser } from '@/app/lib/auth';
import Loading from '@/app/ui/loading';

// 定义说说类型接口
interface Post {
  id: string;
  content: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
  };
  is_liked: boolean;
  likes_count: number;
  comments_count: number;
  comments: {
    id: string;
    content: string;
    created_at: string;
    author: {
      id: string;
      name: string;
    };
  }[];
}

// 说说详情组件
export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentMenuOpen, setCommentMenuOpen] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // 获取当前用户和说说详情
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取说说ID
        const { id } = await params;
        setPostId(id);
        
        // 获取当前用户
        const user = await getClientUser();
        setCurrentUser(user);
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 获取说说详情
        await loadPostDetail(id);
      } catch (error) {
        console.error('获取数据失败:', error);
        setError('获取数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params, router]);
  
  // 加载说说详情
  const loadPostDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/posts');
          return;
        }
        throw new Error('获取说说详情失败');
      }
      
      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      console.error('加载说说详情失败:', error);
      setError('加载说说详情失败，请稍后再试');
    }
  };
  
  // 点赞或取消点赞
  const toggleLike = async () => {
    if (!post) return;
    
    try {
      // 乐观更新UI
      setPost({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
      });
      
      // 发送请求
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: post.is_liked ? 'DELETE' : 'POST',
      });
      
      if (!response.ok) {
        // 如果请求失败，回滚UI
        setPost({
          ...post,
          is_liked: !post.is_liked,
          likes_count: !post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
        });
        
        const errorData = await response.json();
        throw new Error(errorData.error || (post.is_liked ? '取消点赞失败' : '点赞失败'));
      }
    } catch (error: any) {
      console.error(post.is_liked ? '取消点赞失败:' : '点赞失败:', error);
      setNotification(error.message);
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 提交评论
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !commentText.trim()) {
      return;
    }
    
    try {
      setSubmittingComment(true);
      
      // 发送请求
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发表评论失败');
      }
      
      const data = await response.json();
      
      // 更新UI
      setPost({
        ...post,
        comments_count: data.comments_count,
        comments: [...post.comments, data.comment],
      });
      
      // 重置评论输入框
      setCommentText('');
      
      // 显示成功消息
      setNotification('评论发表成功！');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: any) {
      console.error('发表评论失败:', error);
      setNotification(error.message || '发表评论失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // 删除评论
  const deleteComment = async (commentId: string) => {
    if (!post || !confirm('确定要删除这条评论吗？')) {
      return;
    }
    
    try {
      // 发送请求
      const response = await fetch(`/api/posts/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除评论失败');
      }
      
      const data = await response.json();
      
      // 更新UI
      setPost({
        ...post,
        comments_count: data.comments_count,
        comments: post.comments.filter(comment => comment.id !== commentId),
      });
      
      // 显示成功消息
      setNotification('评论删除成功！');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: any) {
      console.error('删除评论失败:', error);
      setNotification(error.message || '删除评论失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setCommentMenuOpen(null);
    }
  };
  
  // 删除说说
  const deletePost = async () => {
    if (!post || !confirm('确定要删除这条说说吗？所有相关的评论和点赞也将被删除。')) {
      return;
    }
    
    try {
      // 发送请求
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除说说失败');
      }
      
      // 显示成功消息并重定向
      setNotification('说说删除成功！');
      setTimeout(() => {
        router.push('/posts');
      }, 1500);
    } catch (error: any) {
      console.error('删除说说失败:', error);
      setNotification(error.message || '删除说说失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>说说详情</h1>
        <Loading fullPage text="加载中" />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>说说详情</h1>
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <p className="text-red-500 mb-4">{error || '找不到该说说'}</p>
          <Link
            href="/posts"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            返回说说列表
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center mb-6">
        <Link
          href="/posts"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          返回
        </Link>
        <h1 className={`${lusitana.className} text-2xl font-bold`}>说说详情</h1>
      </div>
      
      {/* 通知消息 */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {notification}
        </div>
      )}
      
      {/* 说说卡片 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* 说说头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-semibold">{post.author.name}</p>
              <p className="text-gray-500 text-sm">{formatDate(post.created_at)}</p>
            </div>
          </div>
          
          {/* 删除按钮 (仅说说作者和管理员可见) */}
          {(currentUser?.id === post.author.id || currentUser?.role === 'admin') && (
            <button
              className="text-red-500 hover:text-red-700 inline-flex items-center"
              onClick={deletePost}
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              <span>删除</span>
            </button>
          )}
        </div>
        
        {/* 说说内容 */}
        <div className="p-4">
          <p className="text-lg whitespace-pre-wrap mb-4">{post.content}</p>
          
          {/* 说说图片 */}
          {post.image_urls.length > 0 && (
            <div className={`grid ${
              post.image_urls.length === 1 ? 'grid-cols-1' :
              post.image_urls.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            } gap-2 mb-4`}>
              {post.image_urls.map((imageUrl, index) => (
                <div 
                  key={index}
                  className={`aspect-square ${
                    post.image_urls.length === 1 ? 'max-h-96' : ''
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`图片 ${index+1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* 点赞按钮 */}
          <div className="flex items-center mt-4">
            <button
              className={`inline-flex items-center px-4 py-2 rounded-md ${
                post.is_liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
              } hover:bg-gray-100 mr-2`}
              onClick={toggleLike}
            >
              {post.is_liked ? (
                <HeartIconSolid className="h-5 w-5 mr-1 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 mr-1" />
              )}
              <span>{post.likes_count > 0 ? `${post.likes_count} 人赞` : '赞'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 评论区 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold">评论 ({post.comments_count})</h2>
        </div>
        
        {/* 评论输入框 */}
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={submitComment} className="flex items-center">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="写评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              ref={commentInputRef}
              disabled={submittingComment}
            />
            <button
              type="submit"
              className={`text-blue-500 hover:text-blue-700 ${
                (!commentText.trim() || submittingComment) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!commentText.trim() || submittingComment}
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </form>
        </div>
        
        {/* 评论列表 */}
        {post.comments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {post.comments.map(comment => (
              <div key={comment.id} className="p-4">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="flex items-center">
                        <p className="font-semibold text-sm">{comment.author.name}</p>
                        <span className="mx-2 text-gray-300">•</span>
                        <p className="text-gray-500 text-xs">{formatDate(comment.created_at)}</p>
                      </div>
                      <p className="mt-1 break-words">{comment.content}</p>
                    </div>
                  </div>
                  
                  {/* 评论操作按钮 */}
                  {(currentUser?.id === comment.author.id || 
                    currentUser?.id === post.author.id || 
                    currentUser?.role === 'admin') && (
                    <div className="relative">
                      <button
                        className="p-1 rounded-full hover:bg-gray-100"
                        onClick={() => setCommentMenuOpen(commentMenuOpen === comment.id ? null : comment.id)}
                      >
                        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      
                      {commentMenuOpen === comment.id && (
                        <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg z-10">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                            onClick={() => deleteComment(comment.id)}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            暂无评论，快来发表第一条评论吧！
          </div>
        )}
      </div>
    </div>
  );
} 