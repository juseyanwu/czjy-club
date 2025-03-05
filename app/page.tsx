import { GlobeAltIcon, UserGroupIcon, CalendarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";


// 校园社团管理系统主页
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      {/* 顶部标题栏 */}
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-600 p-4 md:h-30">
        <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
          <UserGroupIcon className="h-12 w-12 rotate-[15deg]" />
          <p className="text-[24px]">校园社团管理系统</p>
        </div>
      </div>

      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        {/* 左侧信息区 */}
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <h2 className={`${lusitana.className} text-2xl font-bold text-gray-800`}>社团管理</h2>
          </div>
          
          <p className={`${lusitana.className} text-xl text-gray-800 md:text-2xl md:leading-normal`}>
            <strong>欢迎使用校园社团管理系统</strong>。这里可以浏览社团信息、查看活动安排、管理社团成员。
          </p>
          
          {/* 功能按钮区 */}
          <div className="flex flex-col gap-3 md:flex-row">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 md:text-base"
            >
              <span>登录系统</span> <ArrowRightIcon className="w-5 md:w-6" />
            </Link>
            
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500 md:text-base"
            >
              <span>注册账号</span> <ClipboardDocumentListIcon className="w-5 md:w-6" />
            </Link>
          </div>
        </div>
        
        {/* 右侧内容区 */}
        <div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6 md:w-3/5 md:p-8">
          {/* 最新活动公告 */}
          <div className="rounded-lg bg-white p-4 shadow-md">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <h3 className={`${lusitana.className} text-xl font-bold text-gray-800`}>最新活动</h3>
            </div>
            
            <ul className="space-y-3">
              {[
                { id: 1, title: "摄影社秋季招新", date: "2023-10-15", location: "学生活动中心" },
                { id: 2, title: "辩论社周末辩论赛", date: "2023-10-18", location: "图书馆报告厅" },
                { id: 3, title: "篮球社友谊赛", date: "2023-10-20", location: "体育馆" },
                { id: 4, title: "志愿者协会社区服务", date: "2023-10-22", location: "社区中心" },
              ].map((event) => (
                <li key={event.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100">
                  <div className="flex justify-between">
                    <span className="font-medium text-blue-600">{event.title}</span>
                    <span className="text-sm text-gray-500">{event.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">地点: {event.location}</p>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 text-center">
              <Link href="/events" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                查看全部活动 →
              </Link>
            </div>
          </div>
          
          {/* 热门社团 */}
          <div className="rounded-lg bg-white p-4 shadow-md">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
              <GlobeAltIcon className="h-6 w-6 text-blue-600" />
              <h3 className={`${lusitana.className} text-xl font-bold text-gray-800`}>热门社团</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { id: 1, name: "摄影社", members: 120, category: "艺术" },
                { id: 2, name: "篮球社", members: 85, category: "体育" },
                { id: 3, name: "编程俱乐部", members: 64, category: "科技" },
                { id: 4, name: "志愿者协会", members: 96, category: "公益" },
              ].map((club) => (
                <div key={club.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100">
                  <div className="font-medium text-blue-600">{club.name}</div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-600">分类: {club.category}</span>
                    <span className="text-gray-600">成员: {club.members}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/clubs" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                浏览全部社团 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
