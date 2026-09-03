import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { listBuilds, listContent } from "@/lib/store";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();
  const [content, builds] = await Promise.all([listContent(), listBuilds()]);
  return (
    <AdminShell
      buildCount={
        builds.filter(
          (item) => item.status === "queued" || item.status === "running",
        ).length
      }
      contentCount={content.length}
      username={session.username}
    >
      {children}
    </AdminShell>
  );
}
