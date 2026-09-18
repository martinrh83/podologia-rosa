import { Toaster } from "sonner";

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
      {/*
        Las confirmaciones de lo que se guardó. Ver `withToast`.

        El estilo de Sonner queda por defecto salvo la letra: la suya es de
        13px y del sistema, la más chica de todo el panel. Seis segundos y una
        cruz para cerrar, porque «Se agregó a Bea López. Ya se le puede sacar
        turno.» no se alcanza a leer en cuatro, y en el teléfono no hay hover
        que lo pause.
      */}
      <Toaster
        position="bottom-center"
        duration={6000}
        closeButton
        // La letra va en el contenedor: Sonner le pone la del sistema ahí, y
        // cada toast la hereda de él, no del resto de la página.
        style={{ fontFamily: "inherit" }}
        toastOptions={{ style: { fontSize: "1rem" } }}
      />
    </div>
  );
}
