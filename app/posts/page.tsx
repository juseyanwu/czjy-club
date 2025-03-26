'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
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
  comments_preview: {
    id: string;
    content: string;
    created_at: string;
    author: {
      id: string;
      name: string;
    };
  }[];
}

// 说说列表组件
export default function PostsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{id: string; name: string; email: string; role: string} | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null);

  // 获取当前用户和说说列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取当前用户
        const user = await getClientUser();
        setCurrentUser(user);
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 获取说说列表
        await loadPosts(1);
      } catch (error) {
        console.error('获取数据失败:', error);
        setError('获取数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);
  
  // 加载说说列表
  const loadPosts = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoadingMore(false);
      } else {
        setLoadingMore(true);
      }
      
      const response = await fetch(`/api/posts?page=${pageNum}&pageSize=10`);
      
      if (!response.ok) {
        throw new Error('获取说说列表失败');
      }
      
      const data = await response.json();
      
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setPage(pageNum);
      setHasMore(pageNum < data.pagination.totalPages);
    } catch (error) {
      console.error('加载说说失败:', error);
      setError('加载说说失败，请稍后再试');
    } finally {
      setLoadingMore(false);
    }
  };
  
  // 加载更多说说
  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      loadPosts(page + 1);
    }
  };
  
  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // 限制最多9张图片
      if (selectedImages.length + files.length > 9) {
        setNotification('最多只能上传9张图片');
        setTimeout(() => setNotification(''), 3000);
        return;
      }
      
      // 添加新选择的图片
      setSelectedImages(prev => [...prev, ...files]);
      
      // 创建预览URL
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagesPreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  // 移除选择的图片
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => {
      // 释放已创建的URL
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };
  
  // 提交新说说
  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && selectedImages.length === 0) {
      setError('说说内容和图片不能同时为空');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('content', content);
      
      // 添加图片
      selectedImages.forEach(image => {
        formData.append('images', image);
      });
      
      // 发送请求
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发布说说失败');
      }
      
      const data = await response.json();
      
      // 重置表单
      setContent('');
      setSelectedImages([]);
      setImagesPreviews([]);
      
      // 显示成功消息
      setNotification('说说发布成功！');
      setTimeout(() => setNotification(''), 3000);
      
      // 在列表顶部添加新说说
      setPosts(prev => [data.post, ...prev]);
    } catch (error: any) {
      console.error('发布说说失败:', error);
      setError(error.message || '发布说说失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 点赞或取消点赞
  const toggleLike = async (postId: string, isLiked: boolean) => {
    try {
      // 乐观更新UI
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isLiked,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      }));
      
      // 发送请求
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });
      
      if (!response.ok) {
        // 如果请求失败，回滚UI
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: isLiked,
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1,
            };
          }
          return post;
        }));
        
        const errorData = await response.json();
        throw new Error(errorData.error || (isLiked ? '取消点赞失败' : '点赞失败'));
      }
    } catch (error: any) {
      console.error(isLiked ? '取消点赞失败:' : '点赞失败:', error);
      setNotification(error.message || (isLiked ? '取消点赞失败' : '点赞失败'));
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 提交评论
  const submitComment = async (postId: string) => {
    if (!commentText.trim()) {
      return;
    }
    
    try {
      // 发送请求
      const response = await fetch(`/api/posts/${postId}/comments`, {
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
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: data.comments_count,
            comments_preview: [
              ...post.comments_preview.slice(0, 2),
              data.comment,
            ].slice(0, 3), // 只保留最新的3条评论
          };
        }
        return post;
      }));
      
      // 重置输入框
      setCommentText('');
      setShowCommentInput(null);
    } catch (error: any) {
      console.error('发表评论失败:', error);
      setNotification(error.message || '发表评论失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    }
  };
  
  // 删除说说
  const deletePost = async (postId: string) => {
    if (!confirm('确定要删除这条说说吗？')) {
      return;
    }
    
    try {
      // 发送请求
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除说说失败');
      }
      
      // 更新UI
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      // 显示成功消息
      setNotification('说说删除成功！');
      setTimeout(() => setNotification(''), 3000);
    } catch (error: any) {
      console.error('删除说说失败:', error);
      setNotification(error.message || '删除说说失败，请稍后再试');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setPostMenuOpen(null);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className={`${lusitana.className} text-2xl font-bold mb-8`}>社团说说</h1>
        <Loading fullPage text="加载中" />
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-2xl mx-auto pb-20">
      <h1 className={`${lusitana.className} text-2xl font-bold mb-6`}>社团说说</h1>
      
      {/* 通知消息 */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {notification}
        </div>
      )}
      
      {/* 发布新说说 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={submitPost}>
          <textarea
            placeholder={`${currentUser?.name || '你'}，有什么新鲜事想分享？`}
            className="w-full border border-gray-300 rounded-md p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
          ></textarea>
          
          {/* 已选图片预览 */}
          {imagesPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {imagesPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={preview}
                    alt={`预览图片 ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-gray-800 bg-opacity-50 rounded-full p-1"
                    onClick={() => removeImage(index)}
                  >
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-gray-500 hover:text-blue-500"
              disabled={submitting}
            >
              <PhotoIcon className="h-6 w-6 mr-1" />
              <span>图片</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
                disabled={submitting}
              />
            </button>
            
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={submitting}
            >
              {submitting ? '发布中...' : '发布'}
            </button>
          </div>
          
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </form>
      </div>
      
      {/* 说说列表 */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 说说头部 */}
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">{post.author.name}</p>
                    <p className="text-gray-500 text-sm">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                
                {/* 说说操作菜单 */}
                {(currentUser?.id === post.author.id || currentUser?.role === 'admin') && (
                  <div className="relative">
                    <button
                      className="p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setPostMenuOpen(postMenuOpen === post.id ? null : post.id)}
                    >
                      <EllipsisHorizontalIcon className="h-6 w-6 text-gray-500" />
                    </button>
                    
                    {postMenuOpen === post.id && (
                      <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg z-10">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                          onClick={() => deletePost(post.id)}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 说说内容 */}
              <div className="px-4 py-2">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
              
              {/* 说说图片 */}
              {post.image_urls.length > 0 && (
                <div className={`grid ${
                  post.image_urls.length === 1 ? 'grid-cols-1' :
                  post.image_urls.length === 2 ? 'grid-cols-2' :
                  'grid-cols-3'
                } gap-1 px-4 pb-4`}>
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
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* 统计信息 */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                <div className="flex space-x-4">
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-500"
                    onClick={() => toggleLike(post.id, post.is_liked)}
                  >
                    {post.is_liked ? (
                      <HeartIconSolid className="h-5 w-5 mr-1 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-1" />
                    )}
                    <span>{post.likes_count}</span>
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-blue-500"
                    onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                    <span>{post.comments_count}</span>
                  </button>
                </div>
                <Link
                  href={`/posts/${post.id}`}
                  className="text-blue-500 text-sm hover:text-blue-700"
                >
                  查看详情
                </Link>
              </div>
              
              {/* 评论预览 */}
              {post.comments_preview.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  {post.comments_preview.map(comment => (
                    <div key={comment.id} className="mb-2 last:mb-0">
                      <p className="text-sm">
                        <span className="font-semibold">{comment.author.name}: </span>
                        {comment.content}
                      </p>
                    </div>
                  ))}
                  {post.comments_count > 3 && (
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-gray-500 text-sm hover:text-blue-500"
                    >
                      查看全部 {post.comments_count} 条评论
                    </Link>
                  )}
                </div>
              )}
              
              {/* 评论输入框 */}
              {showCommentInput === post.id && (
                <div className="flex items-center p-3 bg-gray-50 border-t border-gray-100">
                  <input
                    type="text"
                    className="flex-grow border border-gray-300 rounded-full px-4 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="写评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => submitComment(post.id)}
                    disabled={!commentText.trim()}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {/* 加载更多按钮 */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                onClick={loadMorePosts}
                disabled={loadingMore}
              >
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <p className="text-gray-500">暂时没有说说，快来发布第一条吧！</p>
        </div>
      )}
    </div>
  );
} 