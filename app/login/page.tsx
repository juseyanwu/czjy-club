import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import Link from 'next/link';
import LoginForm from '../ui/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-100">
      <div className="flex w-full max-w-md flex-col space-y-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 w-fit mb-4"
        >
          <span>返回首页</span>
        </Link>
        
        <div className="flex flex-col items-center space-y-4 rounded-lg bg-white px-6 py-8 shadow-md">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/favicon.ico"
              width={40}
              height={40}
              alt="Logo"
              className="rounded-full"
            />
            <h1 className={`${lusitana.className} text-2xl font-bold text-gray-800`}>
              校园社团管理系统
            </h1>
          </div>
          
          <LoginForm />
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>还没有账号？ <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">立即注册</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}