import { HelpSidebar } from '@/components/help/HelpSidebar';
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb';
import { AppNav } from '@/components/layout/AppNav';

export const metadata = {
  title: 'Help & Documentation - AI Summit',
  description: 'Documentation and guides for AI Summit documentation management platform',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-64px)] sticky top-16 bg-background">
          <HelpSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HelpBreadcrumb />

          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>

          {/* Feedback Widget */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">Was this page helpful?</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors">
                👍 Yes
              </button>
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors">
                👎 No
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
