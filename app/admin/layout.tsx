import { AdminNav } from '@/components/admin/admin-nav';
import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-shelf px-4 py-6 sm:py-8 md:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8">
        <AdminNav />

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
