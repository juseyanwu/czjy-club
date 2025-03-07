import { lusitana } from '@/app/ui/fonts';
import { CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import EventForm from '@/app/events/create/event-form';

export default function CreateEventPage() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 顶部标题栏 */}
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-600 p-4 md:h-40">
        <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
          <CalendarIcon className="h-10 w-10 mr-2" />
          <p className="text-[32px]">创建新活动</p>
        </div>
      </div>

      <div className="mt-6">
        {/* 返回按钮 */}
        <div className="mb-4">
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← 返回活动列表
          </Link>
        </div>

        {/* 活动创建表单 */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <EventForm />
        </div>
      </div>
    </main>
  );
}