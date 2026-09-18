import type { Metadata } from "next";

import { PageHeading } from "@/components/admin/page-heading";
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
      <PageHeading title="Datos del consultorio" />

      <SettingsForm settings={settings} />
    </div>
  );
}
