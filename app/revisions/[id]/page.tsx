import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { RevisionView } from '@/components/revisions/RevisionView';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getRevision(id: string) {
  const revision = await prisma.revision.findUnique({
    where: { id },
    include: {
      document: {
        include: {
          project: true,
          mainRevision: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      diffs: {
        where: {
          diffType: 'line',
        },
      },
    },
  });

  return revision;
}

export default async function RevisionPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const revision = await getRevision(id);

  if (!revision) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <RevisionView revision={revision as any} userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
