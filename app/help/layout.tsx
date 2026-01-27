import { HelpSidebar } from '@/components/help/HelpSidebar';
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb';
import { AppNav } from '@/components/layout/AppNav';

export const metadata = {
  title: 'Help & Documentation - Docjays',
  description: 'Documentation and guides for Docjays documentation management platform',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AppNav />

      <div className="flex pt-20">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 border-r border-neutral-200 dark:border-neutral-800 min-h-[calc(100vh-80px)] sticky top-20 bg-white dark:bg-black">
          <HelpSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-[1200px] mx-auto px-6 lg:px-16 py-12">
          <HelpBreadcrumb />

          <div className="mt-8">
            {children}
          </div>

          {/* Feedback Widget */}
          <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Was this page helpful?</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                👍 Yes
              </button>
              <button className="px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                👎 No
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
