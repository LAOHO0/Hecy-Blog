import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { listBuilds, listContent } from "@/lib/store";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();
  // 数据库未初始化/暂时不可用时不要让整个后台白屏：
  // 侧栏计数降级为 0，具体页面再各自给出可读的错误提示。
  const [content, builds] = await Promise.all([
    listContent().catch((error) => {
      console.error("[admin] 读取内容失败：", error);
      return [];
    }),
    listBuilds().catch((error) => {
      console.error("[admin] 读取构建记录失败：", error);
      return [];
    }),
  ]);
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
