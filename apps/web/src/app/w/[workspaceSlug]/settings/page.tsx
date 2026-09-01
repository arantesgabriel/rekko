import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { requireCoreSession } from "@/modules/auth/session";
import { getSettingsPageData } from "@/modules/settings/service";

export const metadata = { title: "Configurações" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}/settings`);
  const data = await getSettingsPageData({
    userId: session.user.id,
    slug: workspaceSlug,
  });
  return (
    <PageContainer width="md">
      <PageHeader
        description="Ajuste sua conta, o Workspace e as conexões usadas no dia a dia."
        eyebrow={data.context.name}
        title="Configurações"
      />
      <SettingsView data={data} workspaceSlug={workspaceSlug} />
    </PageContainer>
  );
}
