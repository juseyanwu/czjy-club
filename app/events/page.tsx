/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchEvents } from '@/app/lib/data';

export const dynamic = 'force-dynamic'
export default async function EventsPage() {
  // 从数据库获取活动列表
  const events = await fetchEvents();

  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 顶部标题栏 */}
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-600 p-4 md:h-40">
        <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
          <CalendarIcon className="h-10 w-10 mr-2" />
          <p className="text-[32px]">活动列表</p>
        </div>
      </div>

      <div className="mt-6">
        {/* 创建活动按钮 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`${lusitana.className} text-xl font-semibold`}>所有活动</h2>
          <Link
            href="/events/create"
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <PlusIcon className="w-5" />
            <span>创建活动</span>
          </Link>
        </div>

        {/* 活动列表 */}
        {events.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <p className="text-gray-600">暂无活动，点击上方按钮创建新活动</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* 活动图片 */}
                {event.image_url ? (
                  <div className="relative h-48 w-full">
                    <img
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 h-48 w-full flex items-center justify-center">
                    <CalendarIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-medium text-blue-600">{event.title}</h3>
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>{new Date(event.date).toLocaleDateString('zh-CN')}</span>
                      <span>组织者: {event.organizer_name}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description || '无描述'}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="flex-shrink-0">地点: {event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}