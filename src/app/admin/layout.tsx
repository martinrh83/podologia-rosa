import { AdminNav } from "@/components/admin/admin-nav";
import { getStaffSession } from "@/lib/auth";

/**
 * Admin shell. Mobile-first on purpose: Rosa uses this on her phone, often
 * one-handed, with a patient standing in front of her.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getStaffSession();

  // The login page renders inside this layout too, so the chrome is only shown
  // once there is a session. Un usuario de Auth sin fila en `staff` cae acá
  // igual que uno deslogueado: no ve ni las pestañas del panel.
  if (!session) return <>{children}</>;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <AdminNav />
      {children}
    </div>
  );
}
