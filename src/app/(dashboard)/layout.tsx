import AppLayout from "@/components/layout/AppLayout";
import { checkIsAdmin } from "@/actions/admin";
import { getUserName } from "@/actions/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, userName] = await Promise.all([checkIsAdmin(), getUserName()]);
  return <AppLayout isAdmin={isAdmin} userName={userName}>{children}</AppLayout>;
}
