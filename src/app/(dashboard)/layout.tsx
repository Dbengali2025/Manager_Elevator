import AppLayout from "@/components/layout/AppLayout";
import { checkIsAdmin } from "@/actions/admin";
import { getUserName } from "@/actions/dashboard";
import { requirePaidAccess } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePaidAccess();
  const [isAdmin, userName] = await Promise.all([checkIsAdmin(), getUserName()]);
  return <AppLayout isAdmin={isAdmin} userName={userName}>{children}</AppLayout>;
}
