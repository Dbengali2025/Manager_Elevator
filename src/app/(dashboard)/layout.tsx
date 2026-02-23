import AppLayout from "@/components/layout/AppLayout";
import { checkIsAdmin } from "@/actions/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await checkIsAdmin();
  return <AppLayout isAdmin={isAdmin}>{children}</AppLayout>;
}
