import SidebarNav from '@/app/ui/sidebar-nav';

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SidebarNav />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 