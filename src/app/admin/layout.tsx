import { notFound } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin(await getSession())) notFound();
  return <div className="space-y-4">{children}</div>;
}
