import type { Metadata } from "next";

import { SettingsForm } from "@/components/settings-form";
import { getClinicSettings } from "@/lib/availability";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Datos del consultorio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConsultorioPage() {
  await requireStaff();
  const settings = await getClinicSettings();

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Datos del consultorio</h2>
      <p className="mb-5 mt-1 text-muted">
        Lo que ven los pacientes en la página. Los cambios se aplican al instante.
      </p>

      <SettingsForm settings={settings} />
    </div>
  );
}
